
    oxRule("body",{
        margin:"0",
        backgroundColor:"#333"
    });
    
    oxRule("*", {
        boxSizing:"border-box"
    })
    
    var header=ox("div").css({
        padding:"15px",
        backgroundColor:"#333",
        position:"sticky",
        top:0,
        zIndex:200,
        boxShadow: "0 5px 10px #222"
    });
    var searchInput= ox("input",header).css({
        backgroundColor:"#555",
        padding:"20px",
        border:"none",
        borderRadius:"10px",
        fontSize:"1.25em",
        width:"100%",
    }).attr({
        placeholder:"Search..."
    });
    oxRule("input::placeholder",{
        color:"#999"
    });
    ox("div",header).content("search").attr({
        className: "material-icons"
    }).css({
        fontSize:"3em",
        color:"#999",
        position:"absolute",
        right:"30px",
        top:"calc(50%-0.5em",
    });
    var query={
        term:"ncs",
        limit:"10",
        entity:"album"
    }
    async function getMusic(){
        var url= new URL("https://itunes.apple.com/search");
        Object.keys(query).forEach(k =>{
            url.searchParams.append(k, query[k]);
        });
        return(await fetch(url.href)).json();
    }
    getMusic().then(console.log);
    var albumsContainer = ox("div");
    showAlbums();
    function showAlbums(){
        albumsContainer.content("");
        query.entity="album"
        ox("h1",albumsContainer).content("Albums").css({
            color:"white",
            fontWeight:"200",
            margin:"0",
            padding:"10px"
        })
        var wrapper=ox("div",albumsContainer).css({
            whiteSpace:"nowrap",
            width:"100vw",
            overflowX:"auto"
        })
        getMusic().then(data=>{
            data.results.forEach(album =>{
                var img= album.artworkUrl100.replace("100x100","200x200");
                var albumCont= ox("div", wrapper).css({
                    height:"130px",
                    width:"200px",
                    backgroundImage:"url(" + img +")",
                    display:"inline-block",
                    backgroundPosition:"center",
                    borderRadius:"5px",
                    position:"relative",
                });
                ox("div", albumCont).content(album.collectionName).css({
                    color:"white",
                    fontSize:"1.5em",
                    padding:"5px 10px",
                    position:"absolute",
                    top:"50%",
                    transform:"translateY(-50%)",
                    backdropFilter:"brightness(0.85) blur(10px) saturate(3)",
                    textShadow:"100%",
                    whiteSpace:"normal",
                })
            });
    
    
        })
    }
var tracksContainer = ox("div");
showTracks();
async function showTracks(){
    tracksContainer.content("");
    query.entity="song"
    ox("h1",tracksContainer).content("Tracks").css({
        color:"white",
        fontWeight:"200",
        margin:"0",
        padding:"10px"
    });
    var songs = await getMusic();
    songs.results.forEach(song => {
        var songContainer = ox("div", tracksContainer).css({
            backgroundColor:"#444",
            height:"60px",
            margin:"20px 10px",
            overflow:"hidden",
            boxShadow:"0 2px 5px #222"
        });
        ox("img",songContainer).attr({
            src:song.artworkUrl160
        }).css({
            float:"left",
        })
        var info= ox("div",songContainer).css({
            height:"60px",
            width:"70%",
            float:"left",
            padding:"10px"
        });
        ox("div",info).content(song.trackName).css({
            color:"white",
            fontSize:"20px"
        });
        ox("div",info).content(song.artistName).css({
            color:"#CCC",
            fontSize:"15px"
        });
    })
}



