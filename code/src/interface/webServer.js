// --- Restart API ---
import { exec } from 'child_process';

import express from 'express';
import { changeTimeZone } from '../utils/time.js';
import { colors } from '../utils/driver.js';
import { getBrightnessFactor, setBrightnessFactor } from '../graphics/render.js';
import http from 'http';
import { WebSocketServer } from 'ws';

import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';
import util from 'util';


const app = express();
const port = 80;
app.use(express.json());

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// Simple in-memory session store
const sessions = {};
const SESSION_COOKIE = 'clock_session';
let USERNAME = 'admin';
let PASSWORD = 'password'; // Change this in production!

// Helper to get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CREDS_PATH = path.join(__dirname, 'credentials.json');
// Load credentials from file if exists
if (fs.existsSync(CREDS_PATH)) {
	try {
		const creds = JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
		if (creds.username && creds.password) {
			USERNAME = creds.username;
			PASSWORD = creds.password;
		}
	} catch (e) { console.error('Failed to load credentials:', e); }
}
// Endpoint: Change credentials (username/password)
app.post('/api/credentials', requireLogin, (req, res) => {
	const { username, password } = req.body;
	if (!username || !password) {
		return res.status(400).json({ error: 'Missing username or password' });
	}
	USERNAME = username;
	PASSWORD = password;
	try {
		fs.writeFileSync(CREDS_PATH, JSON.stringify({ username, password }, null, 2));
	} catch (e) {
		return res.status(500).json({ error: 'Failed to save credentials' });
	}
	res.json({ success: true });
});


// Middleware: parse cookies
app.use((req, res, next) => {
	const cookieHeader = req.headers.cookie || '';
	req.cookies = Object.fromEntries(cookieHeader.split(';').map(c => c.trim().split('=')));
	next();
});

// Middleware: check session for protected routes
function requireLogin(req, res, next) {
	const sid = req.cookies[SESSION_COOKIE];
	if (sid && sessions[sid]) {
		req.user = sessions[sid];
		return next();
	}
	res.redirect('/login');
}

// Simple in-memory state for demonstration
let state = {
	timezone: global.selectedTimeZone || 'Etc/UTC',
};

// Endpoint: Get current clock state
app.get('/api/state', (req, res) => {
	res.json({
		timezone: global.selectedTimeZone || 'Etc/UTC',
		timeOffset: global.timeOffset || 0,
		timezoneOffset: global.timezoneOffset || '+00:00',
	});
});

// Endpoint: Login
app.post('/api/login', (req, res) => {
	const { username, password } = req.body;
	if (username === USERNAME && password === PASSWORD) {
		// Create session
		const sid = crypto.randomBytes(16).toString('hex');
		sessions[sid] = { username };
		res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${sid}; HttpOnly; Path=/`);
		return res.json({ success: true });
	}
	res.status(401).json({ success: false, error: 'Invalid credentials' });
});

// Endpoint: Set timezone
app.post('/api/timezone', (req, res) => {
	const { timezone } = req.body;
	if (!timezone) {
		return res.status(400).json({ error: 'Missing timezone' });
	}
	changeTimeZone(timezone);
	state.timezone = timezone;
	res.json({ success: true, timezone });
});


// Serve static CSS for control panel
app.use('/interface/clock_panel.css', (req, res) => {
	res.sendFile(path.join(__dirname, 'clock_panel.css'));
});
// Simple HTML control panel

// Serve login page
app.get('/login', (req, res) => {
	res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve combined control panel (protected)
app.get(['/','/panel'], requireLogin, (req, res) => {
	res.sendFile(path.join(__dirname, 'clock_panel.html'));
});// Serve screen editor (protected)
app.get('/screen-editor', requireLogin, (req, res) => {
	res.sendFile(path.join(__dirname, 'screen_editor.html'));
});
// Expose screens.json for GET requests
app.get('/screens/screens.json', requireLogin, (req, res) => {
	res.sendFile(path.join(__dirname, '../screens/screens.json'));
});

// Allow POST to /screens/screens.json to save screens
app.post('/screens/screens.json', requireLogin, express.json(), (req, res) => {
	const screensPath = path.join(__dirname, '../screens/screens.json');
	fs.writeFile(screensPath, JSON.stringify(req.body, null, 2), (err) => {
		if (err) {
			res.status(500).json({ error: 'Failed to save screens.json' });
		} else {
			res.json({ success: true });
		}
	});
});
// --- Widget BBox API ---
const WIDGETS_PATH = path.join(__dirname, '../widgets');
app.get('/api/widgets/bbox', requireLogin, async (req, res) => {
	const bboxMap = {};
	try {
		const files = await fs.promises.readdir(WIDGETS_PATH);
		for (const file of files) {
			if (!file.endsWith('.js') || file === 'widget.js') continue;
			try {
				const widgetModule = await import(path.join(WIDGETS_PATH, file));
				const WidgetClass = widgetModule.default || widgetModule;
				// Try to instantiate and call getBBox
				let bbox = null;
				try {
					const instance = new WidgetClass(0, 0);
					if (typeof instance.getBBox === 'function') {
						bbox = instance.getBBox();
					}
				} catch (e) {
					bbox = null;
				}
				if (bbox) bboxMap[file] = bbox;
			} catch (e) {
				// Ignore widgets that fail to import/instantiate
			}
		}
		res.json(bboxMap);
	} catch (e) {
		res.status(500).json({ error: 'Failed to query widget bboxes' });
	}
});
// Logout endpoint
app.post('/logout', (req, res) => {
	const sid = req.cookies[SESSION_COOKIE];
	if (sid) delete sessions[sid];
	res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0`);
	res.redirect('/login');
});
const WIDGETS_DIR = path.join(__dirname, '../widgets');
const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
// Serve widget editor (protected)
app.get('/widgets', requireLogin, (req, res) => {
	res.sendFile(path.join(__dirname, 'widget_editor.html'));
});

// API: List widget files (supports ?tree=1 for tree and flat list, including subdirectories)
app.get('/api/widgets', requireLogin, async (req, res) => {
	function walk(dir, rel = '') {
		let tree = {};
		let flat = [];
		const entries = fs.readdirSync(dir, { withFileTypes: true });
		for (const entry of entries) {
			if (entry.name === 'widget.js' && rel !== '') continue; // Only allow root widget.js in list
			if (entry.isDirectory()) {
				const sub = walk(path.join(dir, entry.name), rel ? rel + '/' + entry.name : entry.name);
				if (Object.keys(sub.tree).length > 0) tree[entry.name] = sub.tree;
				flat.push(...sub.flat);
			} else if (entry.isFile() && entry.name.endsWith('.js')) {
				const filePath = rel ? rel + '/' + entry.name : entry.name;
				tree[entry.name] = true;
				flat.push(filePath);
			}
		}
		return { tree, flat };
	}
	try {
		if (req.query.tree) {
			const { tree, flat } = walk(WIDGETS_DIR);
			// Always put widget.js at the top if it exists
			flat.sort((a, b) => (a === 'widget.js' ? -1 : b === 'widget.js' ? 1 : a.localeCompare(b)));
			res.json({ tree, flat });
		} else {
			let files = await readdir(WIDGETS_DIR);
			files = files.filter(f => f.endsWith('.js') && f !== 'widget.js');
			files.unshift('widget.js');
			res.json(files);
		}
	} catch (e) {
		res.status(500).json({ error: 'Failed to list files' });
	}
});

// API: Get widget file content
app.get('/api/widgets/:file', requireLogin, async (req, res) => {
	const file = req.params.file;
	if (!file.endsWith('.js')) return res.status(400).send('Invalid file');
	if (file === 'widget.js') return res.status(403).send('Editing widget.js is not allowed');
	try {
		const content = await readFile(path.join(WIDGETS_DIR, file), 'utf8');
		res.type('text/plain').send(content);
	} catch (e) {
		res.status(404).send('File not found');
	}
});

// API: Save widget file content
app.post('/api/widgets/:file', requireLogin, async (req, res) => {
	const file = req.params.file;
	if (!file.endsWith('.js')) return res.status(400).send('Invalid file');
	if (file === 'widget.js') return res.status(403).send('Editing widget.js is not allowed');
	let data = '';
	req.on('data', chunk => { data += chunk; });
	req.on('end', async () => {
		try {
			await writeFile(path.join(WIDGETS_DIR, file), data, 'utf8');
			res.send('OK');
		} catch (e) {
			res.status(500).send('Save failed');
		}
	});
});

app.post('/api/restart', requireLogin, (req, res) => {
	const type = req.query.type;
	let cmd;
	if (type === 'soft') {
		cmd = 'sudo systemctl restart script-startup.service';
	} else if (type === 'hard') {
		cmd = 'sudo reboot';
	} else {
		return res.status(400).json({ error: 'Invalid restart type' });
	}
	exec(cmd, (err) => {
		if (err) {
			return res.status(500).json({ error: 'Failed to restart' });
		}
		res.json({ success: true });
	});
});

app.get('/api/brightness', requireLogin, (req, res) => {
	res.json({ brightness: getBrightnessFactor() });
});
app.post('/api/brightness', requireLogin, (req, res) => {
	const { brightness } = req.body;
	if (typeof brightness !== 'number' || brightness < 0 || brightness > 1) {
		return res.status(400).json({ error: 'Invalid brightness value' });
	}
	setBrightnessFactor(brightness);
	res.json({ success: true });
});

// --- WebSocket server for live clock display ---

// --- WebSocket server for live clock display ---
const wss = new WebSocketServer({ noServer: true });
let wsClients = new Set();
wss.on('connection', (ws, req) => {
	wsClients.add(ws);
	ws.on('close', () => wsClients.delete(ws));
	ws.on('error', (err) => {
		console.error('WebSocket error:', err);
		ws.close();
	});
});

// Handle upgrade requests for /ws/clock only
server.on('upgrade', (request, socket, head) => {
	if (request.url === '/ws/clock') {
		wss.handleUpgrade(request, socket, head, (ws) => {
			wss.emit('connection', ws, request);
		});
	} else {
		socket.destroy();
	}
});


// Send the full frame to all clients 10 times per second
function amplifyColor(color, brightness) {
	// color is 0xRRGGBB, brightness is 0..1
	let r = (color >> 16) & 0xFF;
	let g = (color >> 8) & 0xFF;
	let b = color & 0xFF;
	if (brightness > 0 && brightness < 1) {
		r = Math.min(255, Math.round(r / brightness));
		g = Math.min(255, Math.round(g / brightness));
		b = Math.min(255, Math.round(b / brightness));
	}
	return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

function getFramePixels() {
	// Convert the colors array to [{x, y, color}] for the client, amplifying color
	const arr = [];
	const brightness = getBrightnessFactor();
	for (let x = 0; x < 32; x++) {
		for (let y = 0; y < 8; y++) {
			let idx = (x+1)%2==0 ? ((x+1)<<3)-y-1 : ((x)<<3) + y;
			let c = colors[idx] || 0;
			let hex = amplifyColor(c, brightness);
			arr.push({ x, y, color: hex });
		}
	}
	return arr;
}

setInterval(() => {
	if (wsClients.size === 0) return;
	const frame = getFramePixels();
	const msg = JSON.stringify({ type: 'frame', pixels: frame });
	for (const ws of wsClients) {
		if (ws.readyState === ws.OPEN) ws.send(msg);
	}
}, 100);

server.listen(port, () => {
	console.log(`Web control panel running at http://localhost:${port}`);
});


