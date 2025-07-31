DROP DATABASE IF EXISTS tilewars;
CREATE DATABASE tilewars;
\c tilewars
CREATE TABLE board (
	id SERIAL PRIMARY KEY,
	x INT,
	y INT,
	color VARCHAR(15)
);
