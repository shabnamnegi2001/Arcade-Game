export class Welcome extends Phaser.Scene {
    constructor() {
        super({ key: 'UserInputScene' });
    }

    preload() {
        // Preload avatar images
        this.load.setPath('assets')
        localStorage.removeItem('username')
        localStorage.removeItem('avatar')
    }

    create() {
        // HTML input element for username
        const formElement = this.createFormField()
    }

    createInputField() {
        // Create an HTML input element
        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.placeholder = 'Enter your username';
        inputElement.style.position = 'absolute';
        inputElement.style.top = '150px';
        inputElement.style.left = `${this.cameras.main.centerX}px`;
        inputElement.style.width = '200px';
        document.body.appendChild(inputElement);

        // Remove the input field when the scene is shutdown
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            inputElement.remove();
        });

        return inputElement;
    }

    formSubmit(event){
        event.preventDefault()
        console.log(event.target.elements.avatar.value)
        this.load.image('avatar',  event.target.elements.avatar.value)
        localStorage.setItem('username', event.target.elements.name.value)

        // creating blob url of image
        const file = event.target.elements.avatar.files[0];

        if (file) {
            const imageURL = URL.createObjectURL(file);
            console.log('Image URL:', imageURL);
            localStorage.setItem('avatar', imageURL)
        }
        this.scene.start('Preloader')
    }

    createFormField(){

        const formElement = document.createElement('form')
        formElement.setAttribute('class', 'welcome-form') 
        formElement.innerHTML = `
        <div class="inner">
            <h1> Join Fantasy Town </h1>
            <label> Enter your name </label>
            <input name='name' placeholder = 'bunny' />
            <label> Select you avatar </label>
            <input type='file' name='avatar' />

            <button type='submit'> Join </button>
        </div>
        `
        formElement.addEventListener('submit',  (event) => this.formSubmit(event) )
        document.body.appendChild(formElement)

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            formElement.removeEventListener('submit', (e) => this.formSubmit(e))
            formElement.remove()
        })        

        return formElement;
    }

}