document.addEventListener('DOMContentLoaded', function () {
    // const selectImage = document.querySelector('.select-image');
    const inputFile = document.querySelector('#file');
    const imgArea = document.querySelector('.img-area');

    // selectImage.addEventListener('click', function (event) {
    //     // event.preventDefault();
    //     // inputFile.click();
    // })

    inputFile.addEventListener('change', function () {
        const image = this.files[0]
        if (image.size < 2000000) {
            const reader = new FileReader();
            reader.onload = () => {
                const allImg = imgArea.querySelectorAll('img');
