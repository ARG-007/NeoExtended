const resultPage = new PageScript(
    "Result Page",
    () => {
        document.addEventListener("keyup", resultPageEventHandler);
        commands = resultPageCommands;
        placeHolderImage = resultPlaceHolderImage;
        QNA.clear();
    },
    () => {
        document.removeEventListener("keyup", resultPageEventHandler);
        commands = null;
        placeHolderImage = null;
        QNA.clear();
    },
);


const resultPageCommands = [
    {
        command: "F1",
        operation: "Capture"
    },
    {
        command: "F2",
        operation: "Download"
    },
];

let resultPlaceHolderImage;
fetch(browser.runtime.getURL("lib/imageplaceholders/ResultPage_Portal_Wheatley.png"))
    .then(response => response.blob())
    .then(blob => resultPlaceHolderImage = blob);

function resultPageEventHandler(e) {
    if (e.key == "F1") extract();

    if (e.key == "F2") QNA.download();
}

async function extract() {


    QNA["test"] = document.querySelectorAll(".ra-title-value")[2].innerText.replace(/ /g, "_");
    let qapairs = document.getElementsByClassName("ra-section-each-question");



    let captureProcess;
    if (document.querySelector(".ra-section-card-selected .ra-section-title").innerText === "Coding") {
        console.log("Embedding all images");
        let imageProcess = Promise.all(
            Array.from(
                document.querySelectorAll(".ra-section-each-question img"),
                (img) => CommonFunctions.embedImage(img)
            )
        );

        await imageProcess;
        console.log("Finished Embedding");

        captureProcess = Promise.all(Array.from(qapairs, async (qa) => {
            let qna = new CQnA(extractQID(qa));

            //To get blacklist and whitelist
            try {
                qa.querySelector(".ra-section-question-card").appendChild(qa.querySelector(".prog-instruction-cont"));
            } catch (e) { };

            try {
                console.log(qna["id"], "Started Processing");
                [qna["lang"], qna["header"], qna["answer"], qna["footer"]] = getAnswer(qa);

                qna["question"] = await constructQuestion(qa);
                console.log(qna["id"], "Finished Processing");
                qna.status = "saved";
            } catch (e) {
                console.log(e);
                qna.status = "failed";
            }

            return QNA.pushQnA(qna);
        }));
    }
    else {
        document.querySelectorAll(".check-answer-cont input").forEach(e => (e.checked)?null:e.click());

        await delay(3000); 

        document.querySelectorAll(".editor").forEach(eiq => {
            if (eiq.parentElement.style.display !== "none") {
                let editor = ace.edit(eiq);
                let lines = editor.getValue().split("\n").length;
                editor.setOption("maxLines",lines);
                editor.setOption("wrap",true);
            }
        });


        console.log("Embedding all images");
        let imageProcess = Promise.all(
            Array.from(
                document.querySelectorAll(".ra-section-each-question img"),
                (img) => CommonFunctions.embedImage(img)
            )
        );

        await imageProcess;
        console.log("Finished Embedding");


        captureProcess = Promise.all(Array.from(qapairs, async qa => {
            let mcq = new MCQnA(extractQID(qa));
            console.log(`Mcq : ${mcq.id} started Processing`);
            qa.querySelector(".question-cont").style.width="50%";
            mcq.question = await htmlToImage.toBlob(qa,
                {
                    backgroundColor: '#ffffff',
                    quality: 1, //100%
                    width: qa.querySelector(".question-cont").scrollWidth,
                    filter: filter,
                    height: qa.scrollHeight - qa.lastChild.scrollHeight,
                    fontEmbedCSS: fontEmbedCSS, //A constant CSS to prevent multiple downloads of CSS sheets
                }
            );

            mcq.answer = await htmlToImage.toBlob(qa.querySelector(".content"), { backgroundColor: "#fff", fontEmbedCSS });

            let actualSolution = qa.querySelector(".sol-cont");
            if(actualSolution){
                actualSolution.style.width = "fit-content";
                mcq.actualSolution = await htmlToImage.toBlob(actualSolution, { backgroundColor: "#fff", fontEmbedCSS });
            }
            console.log(`Mcq : ${mcq.id} finished Processing`);
            mcq.status = "saved";
            return QNA.pushQnA(mcq);
        }));
    }

    await captureProcess;
    console.log(captureProcess);
    QNA.status = "saved";
}

function extractQID(question) {
    let questionText = question.querySelector(".ra-section-question-no").innerText;
    return "Q" + questionText.split(" ")[2];
}

function filter(element) {
    let exclusion = ["ra-section-answer-card", "submitBtn","ra-section-question-type"];
    return !exclusion.some(name => element.classList?.contains(name));
}

async function constructQuestion(question) {
    let renderedImage;
    renderedImage = await htmlToImage.toBlob(question,
        {
            backgroundColor: '#ffffff',
            quality: 1, //100%
            filter: filter, //Excludes answer container
            width: question.scrollWidth,
            height: question.scrollHeight - question.lastChild.scrollHeight,
            fontEmbedCSS: fontEmbedCSS, //A constant CSS to prevent multiple downloads of CSS sheets
        }
    );

    return renderedImage;
}

function getAnswer(question) {
    let answer = question.querySelector(".programming-container");

    let headEditorID = answer.querySelector(".header-content .editor-question").id;
    let editorID = answer.querySelector(".editor-answer").id;
    let footEditorID = answer.querySelector(".footer-content .editor-question").id;

    let headEditorText = (headEditorID) ? ace.edit(headEditorID).getValue() : "";
    let editorText = ace.edit(editorID).getValue();
    let footEditorText = (footEditorID) ? ace.edit(footEditorID).getValue() : "";

    let language = ace.edit(editorID).session.$modeId.split("/")[2].split("_");
    language = (language.length > 1) ? language[language.length - 1] : language[0];

    return [language, headEditorText, editorText, footEditorText];
}

