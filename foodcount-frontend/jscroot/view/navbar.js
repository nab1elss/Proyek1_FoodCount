import {id} from "../url/config.js";

export function main(){
    showMenu('header-toggle',id.navbar);
    activeLink('.nav__link');
    activeLink('.nav__dropdown-item');
}

/*==================== SHOW NAVBAR ====================*/
function showMenu(headerToggle, navbarId){
    const toggleBtn = document.getElementById(headerToggle);
    const nav = document.getElementById(navbarId);
    
    // Validate that variables exist
    if(headerToggle && navbarId){
        toggleBtn.addEventListener('click', ()=>{
            // We add the show-menu class to the div tag with the nav__menu class
            nav.classList.toggle('show-menu')
            // change icon
            toggleBtn.classList.toggle('bx-x')
        })
    }

}

/*==================== LINK ACTIVE ====================*/
function activeLink(className){//'.nav__link'
    const linkColor = document.querySelectorAll(className);
    linkColor.forEach(l => {l.addEventListener('click', function() { 
        linkColor.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
    } );});
}

