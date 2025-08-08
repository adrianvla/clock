import { registerScreen, resetScreens } from '../graphics/render.js';
import {Screen} from './screen.js';
import screensConfig from './screens.json' assert { type: 'json' };



// Function to reload all screens: purge, then register enabled ones (no screen modules)
export async function reloadScreens() {
    resetScreens && resetScreens();
    for (const screen of screensConfig) {
        if (screen.enabled && Array.isArray(screen.widgets) && screen.widgets.length > 0) {
            try {
                // Dynamically import all widget modules and instantiate them
                const widgetInstances = [];
                for (const widget of screen.widgets) {
                    if (widget.src) {
                        try {
                            const widgetModule = await import(`../widgets/${widget.src}`);
                            const WidgetClass = widgetModule.default || widgetModule;
                            // Instantiate with x, y
                            widgetInstances.push(new WidgetClass(widget.x, widget.y));
                        } catch (e) {
                            console.error('Failed to import or instantiate widget:', widget.src, e);
                        }
                    }
                }
                // Create a Screen instance and add all widgets
                const screenInstance = new Screen(screen.name, screen.duration);
                for (const w of widgetInstances) {
                    screenInstance.addWidget(w);
                }
                // Register the Screen instance
                registerScreen(screenInstance);
            } catch (e) {
                console.error('Failed to register screen with widgets:', screen, e);
            }
        }
    }
}

// Optionally, call once at startup
reloadScreens();