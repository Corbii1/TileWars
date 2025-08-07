DROP DATABASE IF EXISTS tilewars;
CREATE DATABASE tilewars;
\c tilewars
CREATE TABLE board (
	x INT NOT NULL,
	y INT NOT NULL,
	color VARCHAR(15)
);
