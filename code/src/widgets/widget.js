class Widget{
    constructor(x,y){
        this.x = x; // X position of the widget
        this.y = y; // Y position of the widget
        this.isStatic = false;
        this.isVisible = true; // Visibility of the widget
    }
    render(x, y, dt){
        // This method should be overridden by subclasses
        throw new Error("Render method not implemented");
    }
    getType(){
        return this.constructor.name;
    }
    getBBox(){
        throw new Error("getBBox method not implemented");
    }
}

export {Widget};