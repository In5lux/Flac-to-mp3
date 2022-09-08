import { readdirSync, statSync, readFile, unlink } from 'fs';
import { spawn, execFile } from 'child_process';
//import { parse, dirname, isAbsolute, join, extname, basename, normalize } from 'path';

const fileExt = '.flac';

const getFilesPath = (dir, files_) => {

	files_ = files_ || [];
	const files = readdirSync(dir);
	for (var i in files) {
		var name = dir + '/' + files[i];
		if (statSync(name).isDirectory()) {
			getFilesPath(name, files_);
		} else if (name.includes(fileExt)) {
			files_.push(name);
		}
	}
	return files_;
};

const filesPath = getFilesPath('C:/MUSIC');

const fileListIterator = filesPath[Symbol.iterator]();

for (const fp of filesPath) {
	console.log(fp);
}

const run = () => {
	const { value, done } = fileListIterator.next();
	console.log(value);
	if (done) return;
	const output = value.replace('.flac', '.mp3');
	const tagsFile = `${value}.txt`;

	//spawn('./metaflac', [`--export-tags-to=${value}.txt`, `${value}`]);

	execFile('./metaflac', [`--export-tags-to=${tagsFile}`, `${value}`], (error, stdout, stderr) => {
		if (error) {
			console.error(`Exec error: ${error.message}`);
			return;
		}
		readFile(`${value}.txt`, 'utf8', (err, data) => {
			if (err) throw new Error(`Ошибка чтения ${value}.txt`);

			const tags = {};

			data = data.split('\n').map(d => {
				d = d.replace(/[\r]$/, '').split('=');
				tags[d[0]] = d[1];
			});

			const wav = spawn('./flac.exe', ['-d', `${value}`, '--stdout'/*, '-o', './src/output/a.wav'*/]);

			//const mp3 = spawn('./lame.exe', ['--abr', '123', '-b', '64', '-B', '192', '-', './src/output/a.mp3']);

			const mp3 = spawn('./lame.exe', [
				'-b', '320',
				'-',
				'--tl', `${tags.ALBUM}`,
				'--ta', `${tags.ARTIST}`,
				'--tt', `${tags.TITLE}`,
				'--tn', `${tags.TRACKNUMBER}`,
				`${output}`]);

			wav.stdout.pipe(mp3.stdin);

			// wav.stdout.on('data', (data) => {

			// });

			wav.stderr.on('data', (data) => {
				console.error(`stderr: ${data}`);
			});

			wav.on('close', (code) => {
				console.log(`FLAC decode process exited with code ${code}`);
			});

			// mp3.stdout.on('data', (data) => {

			// });

			mp3.stderr.on('data', (data) => {
				console.error(`stderr: ${data}`);
			});

			mp3.on('close', (code) => {
				console.log(`MP3 encode process exited with code ${code}`);
				unlink(`${tagsFile}`, err => { if (err) console.log(err.message) });
				run();
			});

		});
	});
}

run();