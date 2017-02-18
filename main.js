var stack;
var order;
var myId;
var windowId;
var isFullscreen;

function init(){
    // Start here
    console.log("front running");

    $("head").append("<style id='tr_style'></style>");
    $("#tr_style").load(chrome.extension.getURL("/style.css"));
    $("body").append("<div id='tr'></div>");

    $("#tr").on("mouseenter",function(e){
        if(isFullscreen)
            $("#tr").css("top","0px");
    });

    $("#tr").on("mouseleave",function(e){
        if(isFullscreen){
            $("#tr").css("top","-52px");
        }else{
            $("#tr").css("top","-56px");
        }
    });

    $(window).on("resize",function(){
        console.log("resize");
        checkIfFullscreen();
    });

    $(window).on('keydown',function(e){
        var key = e.which;
        if(key == 13 && $(".tr_input").is(":focus")){
            //submit form
            var query = $(".tr_input").val();
            url_reg = /^((http|https|ftp):\/\/)?([a-zA-Z0-9\_\-]+)((\.|\:)[a-zA-Z0-9\_\-]+)+(\/.*)?$/;
            if(url_reg.test(query)){
                //URL
                location.href = query;
            }else{
                //Não url
                location.href = "https://www.google.pt/search?q="+query;
            }
            return false;  
        }
    });

    chrome.runtime.sendMessage({"code":"getData"},
        function(response){
            stack = response.stack;
            myId = response.myId;
            windowId = response.windowId;
            console.log(myId+" "+windowId);
            checkIfFullscreen();
            redraw();
    });
    
    console.log("DONE");
}

function checkIfFullscreen(){
    console.log("checkIfFullscreen");
    isFullscreen = (window.innerHeight == screen.height);
    console.log(isFullscreen);
    if(isFullscreen)
        $("#tr").css("top","-52px");
}

function checkForMoves(){
    $.each($(".tr_sortable").children(),function(i,x){
        x = parseInt(x.dataset["tabid"]);
        chrome.runtime.sendMessage({"code":"moveTab","id":x,"index":i});
    });
}

function makeSortable(){
    var tabs = $("#tr").tabs();
    tabs.find( ".tr_sortable" ).sortable({
        axis: "x",
        stop: function(e) {
            tabs.tabs( "refresh" );
            checkForMoves();
        }
    });
}

function addEvents(){
    $(".tr_tab").click(function(e) {
        console.log("click");
        chrome.runtime.sendMessage({"code":"setActive","tabId":e.target.closest("li").dataset["tabid"]});
    });
    $("#tr_prev").click(function(e){
        console.log("BACK");
        window.history.back();
    });
    $("#tr_next").click(function(e){
        console.log("NEXT");
        window.history.forward();
    });
    $("#tr_rel").click(function(e){
        console.log("RELOAD");
        location.reload();
    });
}

function redraw(){
    $("#tr").html("");
    ul = $("<ul>").html("");
    ul.addClass("tr_sortable");
    $.each(stack,function(i,x){
        if(x.windowId == windowId){
            li = $("<li>");
            li.addClass("tr_tab");
            li.attr("data-tabId",x.id);
            li.attr("data-tabIndex",x.index);
            if(x.id == myId)
                li.addClass("tr_this");
            fav = "<img class='tr_favicon' style='width:17px;height:17px;' src='"+x.favIconUrl+"'/>";
            li.html(fav+x.title);
            ul.append(li);
        }
    });
    $("#tr").append(ul);

    url = $("<div>");
    url.addClass("tr_url");
    
    prev = $("<div>");
    prev.attr("id","tr_prev");
    prev.addClass("tr_button");
    prev.text("P");
    url.append(prev);

    next = $("<div>");
    next.attr("id","tr_next");
    next.addClass("tr_button");
    next.text("N");
    url.append(next);

    rel = $("<div>");
    rel.attr("id","tr_rel");
    rel.addClass("tr_button");
    rel.text("R");
    url.append(rel);

    inp = $("<input>");
    inp.addClass("tr_input");
    inp.attr("type","text");
    inp.attr("value",location.href);
    url.append(inp);
    $("#tr").append(url);

    makeSortable();
    addEvents();
}

chrome.runtime.onMessage.addListener(
    function(response, tab, callback){
        stack = response;
        redraw();
    }
);

$(document).on("load", init());
