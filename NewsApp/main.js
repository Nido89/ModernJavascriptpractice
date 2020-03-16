(async function(){
    var token='I735c38e3fd174f21a352d6047bb12401'
    var url='https://newsapi.org/v2/everything?q=coronavirus&from=2020-03-15&to=2020-03-15&sortBy=popularity&apiKey=735c38e3fd174f21a352d6047bb12401';
    var data= await(await fetch(url)).json();
 
  
    console.log(data.articles[4])
    
data.articles.forEach(article => {
        
        var head = document.createElement ("div")
        head.style.backgroundImage= `url(${article.urlToImage}`
        
        head.classList.add('head');
        var title= document.createElement("div")
        title.classList.add("title")
        title.innerText= article.title;
        head.appendChild(title)
        var desc = document.createElement("div")
        desc.classList.add("desc");
        desc.innerHTML= article.description;
        document.body.appendChild(desc)

        document.body.appendChild(head)
        
    });

        

})()


