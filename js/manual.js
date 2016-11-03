var QueryString = function () {
    // This function is anonymous, is executed immediately and 
    // the return value is assigned to QueryString!
    var query_string = {};
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        // If first entry with this name
        if (typeof query_string[pair[0]] === "undefined") {
            query_string[pair[0]] = decodeURIComponent(pair[1]);
            // If second entry with this name
        } else if (typeof query_string[pair[0]] === "string") {
            var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
            query_string[pair[0]] = arr;
            // If third or later entry with this name
        } else {
            query_string[pair[0]].push(decodeURIComponent(pair[1]));
        }
    }
    return query_string;
}();

$('#index').load('https://docs.google.com/document/d/1ajX4qXnLSjfvNr-2CpuLzCkR9bBLJqPJ83TxdbSF8Z8/pub?embedded=true', null, function () {
    $("style").remove();
    $("a").each(function () {
        if ($(this).attr("href") != null)
            if ($(this).attr("href").indexOf("https://www.google.com/url?q=https://docs.google.com/document/d/") != -1) {
                var start = "https://www.google.com/url?q=https://docs.google.com/document/d/".length;
                var cnt = $(this).attr("href").indexOf("&sa=") - start;
                $(this).attr("href", "/index.html?doc=" +
                    $(this).attr("href").substr(start, cnt).replace("/edit", ""));
            }
    });
});
if (QueryString["doc"] == null)
    QueryString["doc"] = "1-mldE0uCpDYvHeaPIWDkMXGJmplpQy2FZuWMDMaeb9c";
if (QueryString["doc"] != null)
    $('#siteloader').load('https://docs.google.com/document/d/' + QueryString["doc"] + '/pub?embedded=true', null, function () {
        $("style").remove();
        $("a").each(function () {
            if ($(this).attr("href") != null)
                if ($(this).attr("href").indexOf("https://www.google.com/url?q=https://docs.google.com/document/d/") != -1) {
                    var start = "https://www.google.com/url?q=https://docs.google.com/document/d/".length;
                    var cnt = $(this).attr("href").indexOf("&sa=") - start;
                    $(this).attr("href", "/index.html?doc=" +
                        $(this).attr("href").substr(start, cnt).replace("/edit", ""));
                }
        });
        if ($("#siteloader").html().trim() == "") {
            $("#siteloader").html("<center><img src='https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Wikidata_logo_under_construction_sign_wide.svg/1024px-Wikidata_logo_under_construction_sign_wide.svg.png'><br>This document has not yet been published. Please check back later.</center>");
        }
        $("p span").each(function () {
            if ($(this).html().trim() == "" && $(this).html().indexOf("&nbsp;") == -1) {
                $(this).html("&nbsp;");
            }
        });
        $("p").each(function () {
            if ($(this).children("span").length >= 2 && $(this).children("span").first().text().trim().match(":$"))
                $(this).children("span").first().css("font-weight", "bold");
        });
    });
$(document).foundation();
$("a[data-open]").click(function (ev) {
    ev.preventDefault();
});
