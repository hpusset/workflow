define(['jquery', 'underscore', 'moment', 'jquery-ui'],
function($, _, moment) {
    var wf = {};

    $(function() {
        "use strict";
        $("#filters ." + location.pathname.split("/")[5]+"input").attr("checked", "checked").parent().attr("style", "font-weight: bold !important;");
        $("#items .validate a").each(function(){
            $(this).click(validate_item_onclick);
        });
        $(".workflow_list .item a.close").click(archivedWorkflow);
        $("#workflow_add_item a").click(modal_onclick);
        $(".workflow_add_category").click(modal_onclick);
        $(".take_untake_item a").click(takeItem);
        $(".take_untake_item a.close").click(untakeItem);
        $(".item_list .edit").click(editItemName);
        $(".item_list .action.close").click(deleteItem);
        $("table #sortable").sortable({
                items: '.item_list',
                stop: function (event, ui) { onDragStop(event, ui, '/api/drag-item/', 'itemPk')}
        }).disableSelection();
        $(".workflow_list").sortable({
            items: '.item',
            stop: function (event, ui) {onDragStop(event, ui, '/api/drag-workflow/')},
        }).disableSelection(); 
        $("#items").sortable({
            items: 'table',
            stop: function (event, ui) { onDragStop(event, ui, '/api/drag-category/', 'categoryPk')}
        }).disableSelection();
        $(".tooltip").tooltip({
            position: { my: "left+15 center", at: "right center" }
        });
        $("#modal_background").click(modal_hide);

        $('body').find('.item_list a.comment').on('click', function(elem) {
            showModalComment(elem);
        });

        $(".workflow-new-form input[type='checkbox']").on('change', function() {
            if(this.checked) {
                $('.workflow-new-form .workflow-model').show();
            }
            else {
               $('.workflow-new-form .workflow-model').hide(); 
            }
        });
        $(".category .glyphicon-edit").on('click', editCategoryName);
        $(".category").find(".controls.close").on('click', deleteCategory);
        wf.utils = {}
        wf.utils.username = $('body').attr('data-username');
        wf.templates = {};
        wf.templates.itemNameEditForm = $('#template_form_item');
        wf.templates.itemCommentModal = $('#template_modal_comment');
        wf.templates.itemComment = $('#template_comment');

        wf.dom = {};
        wf.dom.table = $('table');
        wf.dom.progressBar = $('.progress');
        wf.dom.successBar = wf.dom.progressBar.find('.progress-bar-success');
        wf.dom.untestedBar = wf.dom.progressBar.find('.progress-bar-untested');
        wf.dom.failedBar = wf.dom.progressBar.find('.progress-bar-danger');
        wf.dom.disabledBar = wf.dom.progressBar.find('.progress-bar-disabled');
        wf.dom.items = $('.item');
    });

    function onDragStop(event, ui, url, dataPk) {
        var item = $(ui.item).data(dataPk),
            related = $(ui.item).next().data(dataPk);
        if(related){
            url = url + item + "/" + related + "/";
        } else{ 
            url = url + item + "/";
        }
        wf.ajax.post(url);
    }

    wf.ajax = {};

    wf.ajax.send = function(url, data, type) {
        var dfd = $.ajax({
            url: url,
            type: type,
            data: data,
        });
        dfd.fail(function(jqXHR){
            console.log(jqXHR.responseText);
        });
        return dfd;
    };

    wf.ajax.put = function(url, data) {
        return wf.ajax.send(url, data, 'PUT');
    };

    wf.ajax.patch = function(url, data) {
        return wf.ajax.send(url, data, 'PATCH');
    }

    wf.ajax.post = function(url, data) {
        return wf.ajax.send(url, data, 'POST');
    }

    wf.ajax.delete = function(url, data) {
        return wf.ajax.send(url, data, 'DELETE');
    }

    function send_request($elem){
        var dfd = $.get($elem.attr("href"));
        dfd.fail(function(jqXHR){
                alert(jqXHR.responseText);
        });
        return dfd;
    }

    function archivedWorkflow(){
        if(confirm("This workflow will be archived, are you sure ?")){
            var workflow_pk = this.getAttribute('data-workflow'),
                url = '/api/workflow/' + workflow_pk + '/',
                $elem = $(this).closest('.item');
            wf.ajax.patch(url, { archived: true})
              .done(function(){
                $elem.fadeOut();
              })
        }
        return false;
    }

    function updateProgressBar(){
        var counts = {
            0: 0, // Untested items
            1: 0, // Success items
            2: 0, // Failed items
            3: 0
        },
        total = 0;

        var $trs = $('.item_list');
        $trs.each(function() {
            counts[this.getAttribute('data-status')] += 1;
        });
        total = $trs.length; 
        var successPercent = (counts[1] * 100 )/ total,
            untestedPercent = (counts[0] * 100 )/ total,
            failedPercent = (counts[2] * 100 )/ total,
            disabledPercent = (counts[3] * 100)/ total;

        wf.dom.successBar.css('width', successPercent + '%').text(Math.round(successPercent) + '%');
        wf.dom.untestedBar.css('width', untestedPercent + '%').text(Math.round(untestedPercent) + '%');
        wf.dom.failedBar.css('width', failedPercent + '%').text(Math.round(failedPercent) + '%');
        if(Math.round(disabledPercent) != 0) {
            wf.dom.disabledBar.css('width', disabledPercent + '%').text(Math.round(disabledPercent) + '%');
        } else {
            wf.dom.disabledBar.css('width', disabledPercent + '%').text('');
        }
        updateCounters(counts);
    }

    /*
     * @param Array counts 0 untested, 1 success, 2 failed
     */
    function updateCounters(counts){
        $('.square.success .number').text(counts[1]);
        $('.square.untested .number').text(counts[0]);
        $('.square.failed .number').text(counts[2]);
        $('.square.disabled .number').text(counts[3]);
        $('#filters .success .number').text(counts[1]);
        $('#filters .failed .number').text(counts[2]);
    }

    function takeItem(){
        var elem = $(this),
            username = elem.closest('table').data('username'),
            person_pk = elem.closest('table').data('person-pk'),
            item_pk = elem.closest('.item_list').data('item-pk');
        if(elem.hasClass('not-take')){
            wf.ajax.patch(
                "/api/item/" + item_pk + "/",
                {item_pk: item_pk, assigned_to:person_pk, assigned_to_name_cache:username}
            )
            .done(function(){
                elem.removeClass('not-take');
                var link = $('<a class="close untake"><span class="glyphicon glyphicon-remove"></span></a>');
                elem.closest('.take_untake_item').html(username + link[0].outerHTML);
                $('.untake').click(untakeItem);
            });
        }
    }

    function untakeItem() {
        var elem = $(this);
        var item_pk = elem.closest('.item_list').data('item-pk');
        if(!elem.hasClass('not-take')){
            wf.ajax.patch(
                "/api/item/" + item_pk + "/",
                {item_pk: item_pk, assigned_to:null, assigned_to_name_cache:null}
            )
            .done(function(){
                var link = $('<a class="not-take">Take</a>');
                elem.closest('.take_untake_item').html(link);
                link.click(takeItem);
            });
        }
    }

    function showModalComment(elem) {
        var $modal = $(wf.templates.itemCommentModal.html().trim()).modal(),
            url = $(elem.currentTarget).closest('tr').data('url'),
            itemPk = $(elem.currentTarget).closest('tr').data('item-pk');
        $modal.find('button[type="submit"]').on('click', function(e) {
            e.preventDefault();
            addNewComment($modal, itemPk);
        });
        $.getJSON(url, function(data) {
            $.each(data, function(key, val){
                addCommentToModal($modal, val.id, val.username, val.date, val.text);
            });
        });
    }

    function addCommentToModal($modal, id, username, date, comment) {
        if(typeof username !== 'undefined' && typeof comment !== 'undefined') {
            var $tpl = $(wf.templates.itemComment.html().trim());
            var words = comment.split(' ');
            for(var i in words){
                var word = String(words[i]);
                if(word.startsWith('http')  || 
                   word.startsWith('https') || 
                   word.startsWith('www.')) {
                    if(word.startsWith('www.')) {
                        words[i] = '<a href="https://' + word + '" target="_blank">' + word + '</a>';
                    }
                    else {
                        words[i] = '<a href="' + word + '" target="_blank">' + word + '</a>';
                    }
                }
             }
            comment = words.join(' ');
            $tpl.find('section').attr('data-comment-pk', id);
            $tpl.find('aside .username').text(username);
            $tpl.find('aside .date').text($.datepicker.formatDate('dd/mm', new Date(date)));
            $tpl.find('section').append(comment);
            $modal.find('.modal-body .col-md-12').prepend($tpl);
            if (wf.utils.username == username) {
                $tpl.find('.action a').show().on('click', function() {
                    removeComment($modal, id);
                });
            }
        }
    }

    function removeComment($modal, commentPk) {
        var url = '/api/comments/' + commentPk + '/',
            comment = $modal.find('[data-comment-pk=' + commentPk + ']').closest('article');
        wf.ajax.delete(url, null);
        comment.hide();
    }

    function addNewComment($modal, itemPk) {
        var comment = $modal.find('input').val(),
            url = '/api/comments/' + itemPk + '/',
            personPk = $modal.find('.modal-dialog').data('person'),
            username = $modal.find('.modal-dialog').data('username');
        wf.ajax.post(url, {person: personPk, text: comment})
               .done(function(data) {
                    addCommentToModal($modal, data.id, username, data.date, comment);
                    $modal.find('input').val('');
               });
    }

    function validate_item_onclick() {
        var elem = $(this);
        var url = $(elem).data('url');
        $.get(url)
            .done(function(data){
                var status_old = data.status_old;
                var status_new = data.validation;
                $(elem).closest('tr').attr('data-status', status_new);
                $(elem).closest('td').find('span.validated').removeClass('validated');
                $(elem).find('span').addClass('validated');
                $(elem).closest('td').find('span.last_modification').text(moment(data.updated_at).format('D/MM/YYYY HH:mm'));

                updateProgressBar();
            })
            .fail(function(jqXHR){
                alert(jqXHR.responseText);
            });
        return false;
    }

    function editItemName() {
        var $item = $(this).closest('.item_list'),
            item_pk = $item.data('item-pk'),
            edit = $item.find('.item'),
            editVal = edit.text().trim(),
            $form = $(wf.templates.itemNameEditForm.html().trim());
        edit.find('span').hide();
        edit.find('form').remove();
        $form.find('input:first').val(edit.find('span').text().trim());
        edit.append($form);
        $form.show();
        $form.on('submit', function(e) {
            e.preventDefault();
            changeItemName($item, item_pk);
            return false;
        });
        return false
    }

    function changeItemName(elem, item_pk){
        var newName = $(elem).find('input').val(),
            url = '/api/item/' + item_pk + '/';

        wf.ajax.patch(url, {name: newName})
            .done(function(){
                $(elem).find('.item span').text(newName);
                $(elem).find('.item form').hide();
                $(elem).find('.item span').show();
            }); 
        return false
    }

    function editCategoryName() {
        var $category = $(this).closest('table'),
            $categoryContainer = $(this).closest('th'),
            categoryPk = $category.data('category-pk'),
            $categoryName = $categoryContainer.find('.title').val(),
            $form = $(wf.templates.itemNameEditForm.html().trim());
        
        $categoryContainer.find('.controls, .title').hide();
        $categoryContainer.append($form);
        $form.show().on('submit', function(e) {
            e.preventDefault();
            changeCategoryName($categoryContainer, categoryPk);
        });
    }

    function changeCategoryName($categoryContainer, categoryPk) {
        var newName = $categoryContainer.find('input').val(),
            url = '/api/category/' + categoryPk + '/';
        wf.ajax.patch(url, {name: newName})
            .done(function(data){
              $categoryContainer.find('.title').text(data['name']);
              $categoryContainer.find('input').hide();
              $categoryContainer.find('.title, .controls').show();
            });
    }

    function deleteCategory() {
        var $elem = $(this).closest('table'),
            categoryPk = $elem.data('category-pk'),
            url   = '/api/category/' + categoryPk + '/';
        if(confirm('Delete selected category ?')) {
            wf.ajax.delete(url, {category_pk: categoryPk})
              .done(function() {
                $elem.fadeOut();
            });
        }
    }

    function deleteItem() {
        var $elem = $(this).closest('.item_list'),
            itemPk = $elem.data('item-pk'),
            url = '/api/item/' + itemPk + '/';
        if(confirm('Delete selected item ?')) {
            wf.ajax.delete(url, {item_pk: itemPk})
              .done(function() {
                $elem.fadeOut();
           });
        }
    }

    function modal_onclick() {
        $elem = $(this)
        send_request($elem)
            .done(function(data){ 
                modal_callback($elem, data); 
            });
        return false;
    }

    function modal_callback($elem, data) {
        var $content = $($.trim(data)).filter("#content");
        $content.find("form").attr("action", $elem.attr("href")); // set the correct target url

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
        $.post(f.attr("action"), f.serialize())
            .done(function(data, textStatus, jqXHR){
                if (jqXHR.getResponseHeader("Content-Type") === "text/html; charset=utf-8") {
                    /* post failed, show the form again */
                    modal_callback($("#modal_content form").attr("action"), data);
                }
                else {
                    /* post successfull (this is supposed to be an empty json response) */

                    modal_hide();

                    var cat_id = f.find("select :selected").attr("value");

                    if (typeof cat_id === "undefined") {
                        /* new category, we must reload the whole page to show it */
                        location.reload();
                    }
                    else {
                        /* category already exist, just refresh it */
                        counters["all"] += 1;
                        counters["untaken"] += 1;
                        counters["untested"] += 1;
                        $("#take_untake_category_"+cat_id + "_show a").click();
                    }
                }
            })
            .fail(function(jqXHR){
                console.log(jqXHR.responseText);            
            });
        return false;
    }
});
