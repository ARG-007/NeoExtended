let oldPath = null;

let activePageScript = defaultPageScript;

new MutationObserver(loader)
.observe(
    document.body,
    {
        subtree:true,
        childList:true
    }
);

document.onload = loader();

function loader(){
    let currentPath = document.location.pathname;

    if(currentPath === oldPath){
        console.log("No change in path");
        return;
    }

    
    switch(currentPath){
        case "/mycourses/details": enablePageScript(myCoursePage);break;
        case "/test": enablePageScript(testPage);break;
        case "/result": enablePageScript(resultPage);break;
        default: enablePageScript(defaultPageScript);break;
    }

    oldPath = currentPath;

}

function enablePageScript(pageScript){
    if(pageScript.loaded)
        return;

    activePageScript.unload(); //Unload active script
    activePageScript = pageScript;
    activePageScript.load(); //load 
}

browser.runtime.onMessage.addListener((msg,sender,sendResponse)=>{
    if(msg.from != "Popup") return;

    if(msg.request == "SendComs") sendResponse(commands);

    if(msg.request == "QnAList") sendResponse(QNA.getCodeList());

    if(msg.request == "mcqList") sendResponse(QNA.getMCQList());

    if(msg.request == "activePageStats") sendResponse({activePageName : activePageScript.name,QNAStatus : QNA.status});

    if(msg.request == "download") QNA.download();
    
    return false;
});