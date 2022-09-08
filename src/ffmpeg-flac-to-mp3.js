import { readdirSync, statSync } from 'fs';
import { spawn } from 'child_process';
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

	const convert = spawn('ffmpeg', ['-i', `${value}`, '-b:a', '320k', '-map_metadata', '0', '-id3v2_version', '3', `${output}`]);

	// wav.stdout.on('data', (data) => {

	// });

	convert.stderr.on('data', (data) => {
		console.error(`stderr: ${data}`);
	});

	convert.on('close', (code) => {
		console.log(`Decode process exited with code ${code}`);
		run();
	});
}

run();