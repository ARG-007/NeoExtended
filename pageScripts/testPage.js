const testPage = 
    new PageScript(
        "Test Page",
        () => {
            document.addEventListener("keyup",testPageEventHandler);
            commands = testPageCommands;
            placeHolderImage = testPlaceHolderImage;
            QNA.clear();
            loadIndicator();
        },
        () => {
            document.removeEventListener("keyup",testPageEventHandler);
            commands = null;
            placeHolderImage = null;
            if(QNA.getdownloadStatus() === "NeedToDownload")
                QNA.status = "orphaned";
            else
                QNA.clear();
            try{
                document.querySelector("#section-container").removeChild(progressIndicator);
            } catch(e){
                console.log(e);
            }
        },
    );

const testPageCommands = [
    {
        command : "Ctrl+Shift+Z",
        operation : "Paste Into Editor"
    },
    {
        command : "Ctrl+Shift+X",
        operation : "Copy From Editor"
    },
    {
        command : "F1",
        operation : "Save Question & Answer"
    },
    {
        command : "F2",
        operation : "Download Saved Question & Answer"
    },
];

let testPlaceHolderImage;
fetch(browser.runtime.getURL("resources/imageplaceholders/ResultPage_Portal_Wheatley.png"))
.then(response => response.blob())
.then(blob => testPlaceHolderImage = blob);

function testPageEventHandler(e){
    //Paste Action
    if(e.ctrlKey && e.shiftKey && e.key=="Z"){
        let editorID = e.originalTarget.offsetParent.id;
        
        console.log("Pasting");
        
        let editor = ace.edit(editorID);

        navigator.clipboard.readText().then(text => editor.insert(text));

        console.log("Pasted");
        
    }
    
    //Copy Action
    if(e.ctrlKey && e.shiftKey && e.key=="A"){
        let editorID = e.originalTarget.offsetParent.id;
        
        console.log("Copying");
        
        let editor = ace.edit(editorID);
        let text = editor.getSelectedText();
        text = !!(text) ? text : editor.getValue();

        navigator.clipboard.writeText(text);
        console.log("Copied");
    }
    
    if(e.key=="F1") {
        if(document.querySelector("[aria-labelledby = question-type]").textContent.trim() === "Single File Programming Question")
            captureQA();
        else
            captureMCQ();
    };

    if(e.key=="F2") QNA.download();

}

async function captureQA(){
    let qna;
    
    try{
        QNA["test"] = document.querySelector("[aria-labelledby = header-title]").textContent.trim().replace(/ /g,"_");
    }catch(e){
        QNA["test"] = "_Test_Placeholder_";
        console.log(e);
    }


    try{
        console.log("Saving Code");
        progressIndicator.className = "processing";

        let node = document.querySelector("[aria-labelledby = question]");
        qna = new CQnA("Q"+node.querySelector("[aria-labelledby='question-no font16'] div").textContent.match(/" Question No : (\d+)"/)[1]);
        
        let headEditorID = document.querySelector(".header-content .editor-question").id;
        let editorID = document.querySelector(".editor-answer").id;
        let footEditorID = document.querySelector(".footer-content .editor-question").id;
        
        let lang = ace.edit(editorID).session.$modeId.split("/")[2].split("_");
        qna["lang"] = (lang.length>1) ? lang[lang.length-1] : lang[0];
        
        qna["header"] = (headEditorID)? ace.edit(headEditorID).getValue() : "";
        qna["answer"] = ace.edit(editorID).getValue();
        qna["footer"] = (footEditorID)? ace.edit(footEditorID).getValue() : "";
        
        console.log("Code Saved");
        
        console.log("Started Question Imaging");

        let question = node.querySelector(".programmingquestion");
        let notes = question.querySelector(".notes-container");
        if(notes) question.removeChild(question.querySelector(".notes-container"));
        question.appendChild(document.querySelector(".prog-instruction-cont"));

        console.log("Embedding Images (If Any)");
        await Promise.all(
            Array.from(
                node.querySelectorAll('img'),
                img => CommonFunctions.embedImage(img)
            ));
        console.log("Embedding Completed");

        qna["question"] = await htmlToImage.toBlob(node,
            {
                backgroundColor: '#ffffff',
                width : node.scrollWidth,
                height: node.scrollHeight,
                fontEmbedCSS : fontEmbedCSS
            }
        );

        console.log("Finished Imaging");

        console.log("Question Imaging Completed");

        qna["status"] = "saved";
        progressIndicator.className="saved";
    } catch(e) {
        console.log(e);
        progressIndicator.className="failed";
        qna["status"] = "failed";
    }

    QNA.pushQnA(qna);
    QNA.status = "saved";

}

async function captureMCQ(){
    let qna;
    
    try{
        QNA["test"] = document.querySelector("[aria-labelledby = header-title]").textContent.trim().replace(/ /g,"_");
    }catch(e){
        QNA["test"] = "_Test_Placeholder_";
        console.log(e);
    }

    try{
        progressIndicator.className="processing";
        let node = document.querySelector("[aria-labelledby = question]");
        qna = new MCQnA("Q"+node.querySelector("[aria-labelledby='question-no font16'] div").textContent.match(/" Question No : (\d+)"/)[1]);

        let dontFuckitUp = false;
        /* let width = node.scrollWidth; */

        let editors = node.querySelectorAll(".editor");
        editors.forEach(eiq => {
            if (eiq.parentElement.style.display !== "none") {
                let editor = ace.edit(eiq);
                let lines = editor.getValue().split("\n").length;
                dontFuckitUp = true;
                editor.setOption("maxLines", lines);
                editor.setOption("wrap", true);
            }
        });

        let actualQuestCont = node.querySelector(".question-container");
        if(dontFuckitUp!=true){   
            actualQuestCont.style.width = "50%";
            node.style.height = "fit-content";
        }
        actualQuestCont.style["padding-bottom"] = "0px";

        console.log("Embedding all images");
        let imageProcess = Promise.all(
            Array.from(
                node.querySelectorAll("img"),
                (img) => CommonFunctions.embedImage(img)
            )
        );
        
        (dontFuckitUp)?await delay(1000):await delay(500);
        await imageProcess;
        console.log("Finished Embedding");

        console.log("Finished Question Imaging");
        qna.question = await htmlToImage.toBlob(node,{
            fontEmbedCSS,
            backgroundColor: '#fff',
            width: actualQuestCont.scrollWidth,
            height: node.scrollHeight,
        });
        console.log("Finished Question Imaging");
        qna.answer = await htmlToImage.toBlob(document.querySelector(".answer-container .content"),{ backgroundColor: "#fff", fontEmbedCSS });
        

        actualQuestCont.style.width = "100%";
        actualQuestCont.style["padding-bottom"] = "70px";
        node.style.height = "100%";

        qna.status="saved";
        progressIndicator.className="saved";
    } catch(e) {
        progressIndicator.className="failed";
        qna.status="failed";
        console.log(e);
    }


    QNA.pushQnA(qna);
    QNA.status = "saved";
}

async function loadIndicator(){
    try{
        if(document.querySelector("#each-section-panel #progress-indicator")){
            document.querySelector("#each-section-panel").removeChild(document.querySelector("#progress-indicator"));
            document.querySelector("#each-section-panel").appendChild(progressIndicator);
        }
        else{
            document.querySelector("#each-section-panel").appendChild(progressIndicator);
        }
    } catch (e){
        console.log(e);
        setTimeout(loadIndicator,3000);
    }
}