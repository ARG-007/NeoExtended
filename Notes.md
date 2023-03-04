> Discovered testService that holds t_counter(which does keeps count of 
> elapsed time but not sure if it is main one) in testInstance but changing it crashes the site
> the js file that contains it is 22.js and the thread is called timerunner

>and also HTTP POST request with type "event":"heart_beat" sends answer along with
>time counter maybe changing it will yield some result anyway bye future me !


Why can't the Scripts be loaded into seperate pages 

    like : 
            "kiot791.examly.io/test" -> "testPage.js" 
            "kiot791.examly.io/result" -> "resultPage.js"  
            "kiot791.examly.io/mycourse/details" -> "myCoursePage.js"

well the answer is simple :

    It runs as a SPA (Single Page Application) meaning any path changes would not 
    prompt a full page reload (on which, a browser relies on to load extension's contents)
    rather it changes some parts of page while major parts of it remains unaffected.
    so the scriptEnabler watches for changes in page's body and each time a change occurs
    it checks for path change and loads appropriate script

Why does this thing wants to access all my data on every site i go ?:

    I tries as hard as I can to not to request this permission, but either due to 
    there not being any other way or my limited knowledge of Javascript API this has to happen.
    I couldn't embed images present in a question onto the final screenshot due to them being from
    other sites. I personally believe that all images present in a question is only there to
    ease and further the understanding of it so this had to stay.
