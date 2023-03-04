let fontEmbedCSS, placeHolderImage, commands;


const progressIndicator = document.createElement("div");
progressIndicator.id = "progress-indicator";

const QNA = {
    test: null,
    qaPairs: {},
    mcq:{},
    status: "empty",

    async clear(){
        this.test = null;
        for(let ques in this.qaPairs){
            delete this.qaPairs[ques];
        };
        for(let ques in this.mcq){
            delete this.mcq[ques];
        };
        this.status = "empty";
        this.mode = true;
    },

    pushQnA(QnA){
        switch(QnA.type){
            case "CODE": this.qaPairs[this.getNumericId(QnA.id)] = QnA;break;
            case "MCQ" : this.mcq[this.getNumericId(QnA.id)] = QnA;break;
            default: return false; 
        }
        return true;
    },

    download(){
        if(this.status === "saved" || this.status === "orphaned") {
            let backPort = browser.runtime.connect();
            backPort.onMessage.addListener(async (downloaded)=>{
                let id = this.getNumericId(downloaded.id);
                switch(downloaded.type){
                    case "CODE": this.qaPairs[id].status = downloaded.state;break;
                    case "MCQ": this.mcq[id].status = downloaded.state;break;
                    default: return;
                }
            });
            backPort.onDisconnect.addListener(port => console.log(`Port Disconnected due to : ${port.error}`));
            backPort.postMessage({
                request : "download",
                attachedObject:{
                    test:this.test,
                    qaPairs: Object.values(this.qaPairs),
                    mcq: Object.values(this.mcq),
                }
            });
        }
        else {
            alert("Save Before Download");
        }
    },

    getCodeList(){
        return Object.keys(this.qaPairs).map(
            cq => ({
                    type: this.qaPairs[cq].type,
                    id: this.qaPairs[cq].id,
                    status: this.qaPairs[cq].status
                })
            );
    },

    getMCQList(){
        return Object.keys(this.mcq).map(
            mq => ({
                    type: this.mcq[mq].type,
                    id: this.mcq[mq].id,
                    status: this.mcq[mq].status
                })
            );
    },

    getNumericId(id){
        return id.match("\\d+");
    },

    getdownloadStatus(){
        let remaining = 0;
        remaining += Object.keys(this.qaPairs).filter(e => this.qaPairs[e].status === "saved" || this.qaPairs[e].status === "failed").length;
        remaining += Object.keys(this.mcq).filter(e => this.mcq[e].status === "saved" || this.mcq[e].status === "failed").length;
        return (remaining>0)?"NeedToDownload":"NoLeftOver";
    }
};

const ace = window.wrappedJSObject.ace;
XPCNativeWrapper(window.wrappedJSObject.ace);

const delay = (delayInms) => new Promise(resolve => setTimeout(resolve, delayInms));

fetch(browser.runtime.getURL("resources/FontCSS.txt"))
.then(response => response.text())
.then(css => {fontEmbedCSS = css; console.log("CSS Object Ready for Action")});

class PageScript{
    name;
    #loadFunction;
    #unloadFunction;
    loaded;
    constructor(name,loadFunction,unloadFunction){
        this.name = name;
        this.#loadFunction = loadFunction;
        this.#unloadFunction = unloadFunction;
        this.loaded = false;    
    }

    load(){
        console.log(`Loading ${this.name} Script`);
        this.#loadFunction();
        this.loaded = true;
    }

    unload(){
        console.log(`Unloading ${this.name} Script`);
        this.#unloadFunction();
        this.loaded = false;
    }

}

class CommonFunctions{
    static blobToDataURI (blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    static async embedImage(image) {

        let response,blob;
        image.crossOrigin = "anonymous";
        try {
            response = await fetch( image.src,{ cache: 'no-cache', mode: 'cors' } );
            if(response.ok == false) {
                console.log(`Falling back to E'Old Content Fetch, Status: ${response.status} Src: ${image.src} `);
                response = await content.fetch( image.src,{ cache: 'reload', mode: 'cors' } );
            } else {
                console.log(`Hey see this! it actually worked (Normal fetch) Status: ${response.status} Src: ${image.src} `);
            }
            blob = await response.blob();
        } catch(e) {    
            console.log("Cannot download image, defaulting to placeholder Image, error: ",e);
            blob = placeHolderImage;
            image.width=480;
        }
        image.src = await this.blobToDataURI(blob);

    }
}


class CQnA{
    #STATUS;
    constructor(id = null){
        this.id = id;
        this.status = "processing";
        this.lang = null;
        this.question = null;
        this.answer = null;
        this.header = null;
        this.footer = null;
    }

    set status(value){
        this.#STATUS = value;
        browser.runtime.sendMessage({
            request: "updateQnA",
            payload:{
                type: this.type,
                id: this.id,
                status: value,
            }
        }).catch(()=>console.log("Popup not Shown"));
    }

    get status(){
        return this.#STATUS;
    }

    get type(){
        return "CODE";
    }


}

class MCQnA{
    #STATUS;
    constructor(id = null){
        this.id = id;
        this.question = null;
        this.answer = null;
        this.status = "processing";
        this.actualSolution = null;
    }

    set status(value){
        this.#STATUS = value;
        browser.runtime.sendMessage({
            request: "updateQnA",
            payload:{
                type: this.type,
                id: this.id,
                status: value,
            }
        }).catch(()=>console.log("Popup not Shown"));
    }

    get type(){
        return "MCQ";
    }

    get status(){
        return this.#STATUS;
    }

}