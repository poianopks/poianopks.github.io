# piano1.co.kr 배달부

`_piano1/site/` 안의 파일을 GitHub Actions가 나호스팅 FTP로 올려요(`.github/workflows/piano1-ftp.yml`).

- 폴더 이름이 `_`로 시작해서 poianopks.github.io에는 공개되지 않아요.
- `_piano1/site/`가 바뀐 채로 main에 들어가면 자동으로 올라가요. Actions 화면에서 직접 실행할 수도 있어요.
- 서버에 있는 파일은 지우지 않아요. 같은 이름의 파일만 새 것으로 바꿔요.
- 접속 정보는 저장소 Secrets(FTP_SERVER, FTP_USERNAME, FTP_PASSWORD, FTP_DIR)에만 있어요.
