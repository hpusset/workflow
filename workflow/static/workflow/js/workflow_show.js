
$(document).ready(function() {
    $("#filters ." + location.pathname.split("/")[5]+" input").attr("checked", "checked").parent().attr("style", "font-weight: bold !important;");

    $("#items .take_untake_item a").click(take_untake_item_onclick);
    $("#items .take_untake_category a").click(take_untake_category_onclick);
    $("#items .validate a").click(validate_item_onclick);

    $("#workflow_add_item a").click(modal_onclick);
    $("#workflow_add_category a").click(modal_onclick);

    $("#items th a").click(modal_onclick);

    update_counters_html();
    modal_hide();
});


function send_request($elem, callback) {
    $.ajax({
        url: $elem.attr("href"),
        type: "GET",
        timeout: 3000,
        success: function(data, textStatus, jqXHR) {
            callback($elem, data);
            update_counters_html();
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            alert("An unexpected error happened. Please refresh the page.");
        },
    });
}


function update_counters_data(status_old, status_new) {
    var status = ["all", "mine", "untaken", "taken", "success", "failed", "untested"];

    for (var i = 0, imax = status.length; i < imax; ++i) {
        if (status_old === status[i]) {
            counters[status[i]] -= 1;

            if (status_old === "mine")
                counters["taken"] -= 1;
        }

        if (status_new === status[i]) {
            counters[status[i]] += 1;

            if (status_new === "mine")
                counters["taken"] += 1;
        }
    }
}


function update_counters_html() {
    var status = 0, i = 0, imax = 0, total = 0;

    status = ["success", "failed", "untested"];

    for (i = 0, imax = status.length; i < imax; ++i) {
        total += counters[status[i]];
    }

    for (i = 0, imax = status.length; i < imax; ++i) {
        var percent = Math.round(counters[status[i]]/total*100);
        $("#progressbar table ." + status[i]).css("width", ""+percent+"%");
        $("#progressbar div ." + status[i] + " .number").text(counters[status[i]]);
    }

    status = ["all", "mine", "untaken", "taken", "success", "failed"];

    for (i = 0, imax = status.length; i < imax; ++i) {
        $("#filters ." + status[i] + " .number").text(counters[status[i]]);
    }

}


/*
    take untake item
*/

function take_untake_item_onclick() {
    send_request($(this), take_untake_item_update);
    return false;
}


function take_untake_item_update($elem, data) {
    var status_old = $elem.attr("data-status"), status_new = "";
    var $parent_elem = $elem.parent();

    if (status_old === "untaken")
        status_new = "mine";
    else
        status_new = "untaken";

    update_counters_data(status_old, status_new);

    $parent_elem.html(data);
    $parent_elem.find("a").click(take_untake_item_onclick);
}


/*
    take untake category
*/

function take_untake_category_onclick() {
    send_request($(this), take_untake_category_update);
    return false;
}

function take_untake_category_update($elem, data) {
    var $table = $elem.closest("table");
    var $elems = $table.find(".take_untake_item");

    /* clear take / untake data */

    var status_new = "";
    if ($elem.parent().hasClass("take"))
        status_new = "mine";
    else
        status_new = "untaken";

    for (var i = 0, imax = $elems.length; i < imax; ++i) {
        var status_old = $($elems[i]).find("a").attr("data-status");
        update_counters_data(status_old, status_new);
    }

    /* update html */
    var nb_elem_before = $table.find("tr").length;
    $table.html(data);
    $table.find("th a").click(modal_onclick);
    $table.find(".take_untake_item a").click(take_untake_item_onclick);
    $table.find(".take_untake_category a").click(take_untake_category_onclick);
    $table.find(".validate a").click(validate_item_onclick);

    /* hack to update the counters which skipped hidden items */
    var diff = $table.find("tr").length - nb_elem_before;
    if (status_new === "mine" && (location.pathname.split("/")[5] === "mine" || location.pathname.split("/")[5] === "taken"))
    {
        counters["mine"] += diff;
        counters["taken"] += diff;
        counters["untaken"] -= diff;
    }
    if (status_new === "untaken" && location.pathname.split("/")[5] === "untaken")
    {
        counters["mine"] -= diff;
        counters["taken"] -= diff;
        counters["untaken"] += diff;
    }
}


/*
    validate
*/

function validate_item_onclick() {
    send_request($(this), validate_item_update);
    return false;
}


function validate_item_update($elem, data) {
    var status_old = $elem.attr("data-status-old");
    var status_new = $elem.attr("data-status-new");
    var $parent_elem = $elem.parent();

    update_counters_data(status_old, status_new);

    $parent_elem.html(data);
    $parent_elem.find("a").click(validate_item_onclick);
}


/*
    Modal
*/

function modal_onclick() {
    send_request($(this), modal_callback);
    return false;
}

function modal_callback($elem, data) {
    _modal_callback($elem.attr("href"), data);
}

function _modal_callback(post_url, data) {
    var $content = $($.trim(data)).filter("#content");
    $content.find("form").attr("action", post_url); // set the correct target url

    $("body #modal_content").html($content.html()+'<a href="#" class="close_modal">&times;</a>');
    $("#modal_content form :submit").click(modal_form_submit_onclick);

    // callback to close the modal
    $("#modal_background").click(modal_hide);
    $("#modal_content .close_modal").click(modal_hide);

    modal_show();
}

function modal_show() {
    $("#modal_content").css("top", window.scrollY);
    $("#modal_background").show();
    $("#modal_content").show();
    return false;
}

function modal_hide() {
    $("#modal_background").hide();
    $("#modal_content").hide();
    return false;
}

function modal_form_submit_onclick() {
    var f = $("#modal_content form");

    $.ajax({
        url: f.attr("action"),
        type: "POST",
        data: f.serialize(),
        timeout: 3000,
        success: function(data, textStatus, jqXHR) {
            if (jqXHR.getResponseHeader("Content-Type") == "text/html; charset=utf-8") {
                /* post failed, show the form again */
                _modal_callback($("#modal_content form").attr("action"), data);
            }
            else {
                /* post successfull (this is supposed to be an empty json response) */

                modal_hide();

                var cat_id = f.find("select :selected").attr("value");
                var $cat_show = $("#take_untake_category_"+cat_id + "_show a");

                if ((typeof cat_id != "undefined") && ($cat_show.length === 0)) {
                    /* the item is created in an empty category, we must reload the whole page to show it */
                    location.reload();
                }
                else {
                    /* category already exist with items, just refresh it */
                    $cat_show.click();
                    counters["all"] += 1;
                    counters["untaken"] += 1;
                    counters["untested"] += 1;
                    update_counters_html();
                }
            }
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            alert("An unexpected error happened. Please refresh the page.");
        },
    });
    return false;
}