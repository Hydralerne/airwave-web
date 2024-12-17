window.addEventListener('popstate', function (event) {
    if (currentPage == 'player') {
        draggablePlayer.closeMenu()
    } else if (currentPage == 'queue') {
        relatedDraggable.closeMenu()
    } else if (currentPage == 'reply') {
        draggableMusic.closeMenu()
    } else if (currentPage == 'song') {
        draggableSong.closeMenu()
    } else if (currentPage == 'menu') {
        closeMenuMobile()
    } else if (currentPage == 'lyrics') {
        closeLyrics()
    } else {
        document.querySelectorAll('.page.center').forEach(page => {
            if (!page.classList.contains('player')) {
                page.classList.remove('center')
            }
        })
    }
    currentPage = event.state.page
});
