const myCoursePage = new PageScript(
        "My Course Page",
        () => {
            document.addEventListener("click",addVimeoParameters);
        },
        () => {
            document.removeEventListener("click",addVimeoParameters);
        }
    );

function addVimeoParameters(){
    let player = document.querySelector("iframe");

    if(!player.src.match("vimeo") || !!player.src.match("\\?autopause"))
        return;
    
    player.src+="?autopause=0&quality=240p";
}
