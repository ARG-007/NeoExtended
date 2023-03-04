let currentTab;

async function addCommands(commands){
    console.log("Received Commands");
    for(let command of commands) {
        let commandDiv = document.createElement("p");
        commandDiv.textContent = command.command +" : "+ command.operation
        document.querySelector(".hotkeyArea").appendChild(commandDiv);
    }
}

async function addQnAs(responses){
    if(responses.length == 0) return;
    document.querySelector("#questionPlaceHolder").classList.add("hidden");
    for(let q of responses){
        pushQnA(q);
    }
}

async function pushQnA(q){
    document.querySelector("#questionPlaceHolder").classList.add("hidden");
    let qTag = document.createElement("div");
    qTag.id = `${q.type}-${q.id}`;
    qTag.className = q.status;
    qTag.innerText = q.id;
    qTag.tag = q.type;
    qTag.onclick = (e)=>console.log(`Got Clicked : ${e.target.id}`);
    document.querySelector(`.${q.type}`).appendChild(qTag);
}

async function updateQnA(q){
    let qt = document.getElementById(`${q.type}-${q.id}`);
    if(qt){
        qt.className = q.status;
    }
    else{
        pushQnA(q);
    }
    
}

document.getElementById("dwnBtn").addEventListener("click",()=>browser.tabs.sendMessage(currentTab,{from:"Popup",request:"download"}));

function pageReleventAction(stats){
    switch(stats.activePageName){
        case "My Course Page":
            document.querySelector("#coursePage").classList.remove("hidden");
            break;
        case "Test Page":
        case "Result Page":
            document.querySelector("#solutionPage").classList.remove("hidden");
            document.querySelector("#questionPanel").className = "";
            console.log("Requesting for Current Page Commands");
            browser.tabs.sendMessage(currentTab,{from:"Popup",request:"SendComs"},addCommands);
            console.log("Requesting for CodeQnA List");
            browser.tabs.sendMessage(currentTab,{from:"Popup",request:"QnAList"},addQnAs);
            console.log("Requesting for MCQnA List");
            browser.tabs.sendMessage(currentTab,{from:"Popup",request:"mcqList"},addQnAs);
            break;
        default:
            document.querySelector("#default").classList.remove("hidden");
    }
    if(stats.QNAStatus==="orphaned"){
        document.querySelector("#questionPanel").className = "";
        console.log("Requesting for CodeQnA List");
        browser.tabs.sendMessage(currentTab,{from:"Popup",request:"QnAList"},addQnAs);
        console.log("Requesting for MCQnA List");
        browser.tabs.sendMessage(currentTab,{from:"Popup",request:"mcqList"},addQnAs);
    }
}

browser.runtime.onMessage.addListener(msg => {
    switch(msg.request){
        case "addtoQnAList" : pushQnA(msg.payload);break;
        case "updateQnA" : updateQnA(msg.payload);break;
    }
});


browser.tabs.query({
    active:true,
    currentWindow:true
})
.then(
    (tabs) => {
        currentTab = tabs[0].id;
        browser.tabs.sendMessage(currentTab,{from:"Popup",request:"activePageStats"},pageReleventAction);
    }
);
    
