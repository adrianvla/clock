class Screen {
    constructor(name, duration = 20000) {
        this.widgets = []; // {x,y,type,renderFunction}
        this.name = name;
        this.duration = duration; // Duration in milliseconds
    }

    addWidget(w) {
        this.widgets.push(w);
        return this;
    }

    render(dx=0, dy=0, dt=1, isTransitioning = false){
        for(let i = 0; i < this.widgets.length; i++) {
            if(isTransitioning){
                if(this.widgets[i].isStatic){
                    if(this.widgets[i].isVisible)
                        this.widgets[i].render(0, 0, dt);
                } else {
                    this.widgets[i].render(dx, dy, dt);
                }
            }else
                this.widgets[i].render(dx,dy,dt);
        }
    }
    calculateStaticElements(screen, stopRendering = false){
        //map elements by x,y. Make new map pair<x,y> -> element
        const Mine = true;
        const Other = false;

        let staticElements = {};
        for(let i = 0; i < this.widgets.length; i++) {
            const key = `${this.widgets[i].x},${this.widgets[i].y},${this.widgets[i].getType()}`;
            if(key in staticElements) 
                staticElements[key].push([Mine, i]);
            else 
                staticElements[key] = [[Mine, i]];
        }
        for(let i = 0; i < screen.widgets.length; i++) {
            const key = `${screen.widgets[i].x},${screen.widgets[i].y},${screen.widgets[i].getType()}`;
            if(key in staticElements) 
                staticElements[key].push([Other, i]);
            else 
                staticElements[key] = [[Other, i]];
        }

        for(let key in staticElements){
            if(staticElements[key].length > 1){
                let mineIndex = -1;
                let otherIndex = -1;
                for(let i = 0; i < staticElements[key].length; i++){
                    if(staticElements[key][i][0] === Mine) mineIndex = staticElements[key][i][1];
                    else otherIndex = staticElements[key][i][1];
                }
                if(mineIndex !== -1 && otherIndex !== -1){
                    this.widgets[mineIndex].isStatic = true;
                    screen.widgets[otherIndex].isVisible = !stopRendering;
                }
            }
        }
    }
}

export { Screen };