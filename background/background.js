let contentPort;
browser.runtime.onConnect.addListener(initPort);

const mcqTemplate = (id,ques,ans,sol) => 
`# ${id}
>|Question|Answer|
>|:--:|:--:|
>|![](${ques})|![](${ans})
>## Reason
>${(sol) ? '![](' + sol + ')' : '\`Not Available\`'}
---\n\n`;

function initPort(port){
    contentPort = port;
    contentPort.onMessage.addListener(processMessage);
    contentPort.onDisconnect(p => console.log(`Port Disconected due to an error : ${p}`));
}


function processMessage(message){
    if(message.request === "download") download(message.attachedObject);
}

let downloadToID = new Map();

browser.downloads.onChanged.addListener(async downloadedFile => {
    let id = downloadedFile.id;
    browser.downloads.search({id}).then(item => URL.revokeObjectURL(item.url));
    let state = (downloadedFile.state.current === "complete")?"downloaded":"failed";
    let details = {
        ...downloadToID.get(id),
        state,
    }
    contentPort.postMessage(details);
    downloadToID.delete(id);
    return;
})


async function download(qna){
    console.log("Downloading.....");

    const testTile = qna.test;
    const folderPrefix = `course//${testTile}`;
    let markDown = "";
    let markDownFile;

    if(qna.qaPairs.length){
        const mdImageTag = (id,image) => `# ${id}\n\n# ![${id}](${image})\n\n`;
        const code = (lang,code) => `\`\`\`${lang}\n${code}\n\`\`\``
        const seperator = "\n\n"+"-".repeat(30)+"\n\n";
        for(let qa of qna.qaPairs){
            try{
                //Code Saving
                let codeAnswer = code(qa.lang,qa.answer);
                if(qa.header||qa.footer){
                    codeAnswer = "\n> **Written Code:**\n"+codeAnswer;
                    if(qa.header) codeAnswer = "\n> **Header Snippet:**\n"+code(qa.lang,qa.header) + codeAnswer;
                    if(qa.footer) codeAnswer =codeAnswer + "\n> **Footer Snippet:**\n"+code(qa.lang,qa.footer);
                }
                let imageName = `${testTile}//${qa.id}.png`;
                let qaText = mdImageTag(qa.id,imageName) + codeAnswer + seperator;
                markDown += qaText;
                
                //Image Saving
                let qaImage = URL.createObjectURL(new File([qa.question],imageName,{type:"image/png"}));
                browser.downloads.download({
                    url : qaImage,
                    filename : `${folderPrefix}//${imageName}`,
                    conflictAction: "overwrite"
                })
                .then(downloadItemID => downloadToID.set(downloadItemID,{id: qa.id,type: "CODE"}));

            }catch(e){
                console.log(e);
                continue;
            }
        }

        markDownFile = new File([markDown],`${folderPrefix}//${testTile}.md`,{type:"text/plain;charset=utf-8"});

        browser.downloads.download({
        url:URL.createObjectURL(markDownFile),
        filename: markDownFile.name,
        conflictAction: "overwrite"
        }).then(downloadId => downloadToID.set(downloadId,{id: "CodeAnswer",type: "CODE_ANSWER"}));
    }

    if(qna.mcq.length){   
        const questionName = (id) => `${testTile}//MCQ//${id}_Ques.png`;
        const answerName = (id) => `${testTile}//MCQ//${id}_Ans.png`;
        const actSolName = (id) => `${testTile}//MCQ//${id}_Sol.png`;
/*         const mcqTemplate = (id,ques,ans,sol) => 
        `# ${id}
        >|Question|Answer|
        >|:--:|:--:|
        >|![](${ques})|![](${ans})|
        >## Reason\n>${(sol)?'![]('+sol+')':'\`Not Available\`'}
        ---\n
        `; */ 
        markDown = "";
        for(let qa of qna.mcq){
            let qN = questionName(qa.id);
            let aN = answerName(qa.id);
            let sN = (qa.actualSolution)?actSolName(qa.id):"";
            markDown += mcqTemplate(qa.id,qN,aN,sN);

            browser.downloads.download({
                url: URL.createObjectURL(qa.question),
                filename: `${folderPrefix}//${qN}`,
                conflictAction: "overwrite"
            }).then(downloadItemID => downloadToID.set(downloadItemID,{id: qa.id,type: "MCQ"}));
            browser.downloads.download({
                url: URL.createObjectURL(qa.answer),
                filename: `${folderPrefix}//${aN}`,
                conflictAction: "overwrite"
            });

            if(qa.actualSolution)
                browser.downloads.download({
                    url: URL.createObjectURL(qa.actualSolution),
                    filename: `${folderPrefix}//${sN}`,
                    conflictAction: "overwrite"
                });
            
        }

        markDownFile = new File([markDown],`${folderPrefix}//${testTile}_MCQ.md`,{type:"text/plain;charset=utf-8"});

        browser.downloads.download({
            url: URL.createObjectURL(markDownFile),
            filename: markDownFile.name,
            conflictAction: "overwrite"
        });
    }

}
