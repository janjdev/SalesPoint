window.addEventListener('DOMContentLoaded', () => {

    $('.nav-item a.print').on('click', function(e){
        e.preventDefault();
        window.print();
    })

});