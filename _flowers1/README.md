# flowers1.co.kr 배달부

`_flowers1/site/` 안의 파일을 GitHub Actions가 flowers1.co.kr FTP로 올려요(`.github/workflows/flowers1-ftp.yml`).

- 폴더 이름이 `_`로 시작해서 poianopks.github.io에는 공개되지 않아요.
- 서버에 있는 파일은 지우지 않아요. 같은 이름의 파일만 새 것으로 바꿔요.
- 접속 정보는 저장소 Secrets(FTP3_SERVER, FTP3_USERNAME, FTP3_PASSWORD, FTP3_DIR)에만 있어요.
