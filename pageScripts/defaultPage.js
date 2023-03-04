const defaultPageScript = 
    new PageScript(
        "Default Script",
        () => console.log("Reached a page where no valid script can be loaded"),
        () => console.log("Reached a page where a valid script can be loaded")
    );
