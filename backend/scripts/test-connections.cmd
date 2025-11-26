@echo off
REM Teste rápido para endpoints de conexões (Windows cmd)
REM Antes de rodar, defina as variáveis de ambiente ALUNO_TOKEN e MONITOR_TOKEN
IF "%ALUNO_TOKEN%"=="" (
  echo AVISO: variavel ALUNO_TOKEN nao definida. Defina com seu token JWT do aluno.
  echo Exemplo: set ALUNO_TOKEN=eyJhbGciOiJI...
)
IF "%MONITOR_TOKEN%"=="" (
  echo AVISO: variavel MONITOR_TOKEN nao definida. Defina com seu token JWT do monitor.
  echo Exemplo: set MONITOR_TOKEN=eyJhbGciOiJI...
)

echo.
echo 1) Criar solicitação (aluno -> monitor id=1)
curl -s -X POST http://localhost:3000/connections -H "Authorization: Bearer %ALUNO_TOKEN%" -H "Content-Type: application/json" -d "{\"monitor_id\":1}" -w "\nHTTP_CODE:%%{http_code}%%\n"

echo.
echo 2) Listar solicitações enviadas pelo aluno
curl -s http://localhost:3000/connections/aluno -H "Authorization: Bearer %ALUNO_TOKEN%" -w "\nHTTP_CODE:%%{http_code}%%\n"

echo.
echo 3) Listar solicitações recebidas pelo monitor
curl -s http://localhost:3000/connections/monitor -H "Authorization: Bearer %MONITOR_TOKEN%" -w "\nHTTP_CODE:%%{http_code}%%\n"

echo.
echo Para aceitar/recusar uma solicitacao (substitua <ID> pelo id retornado):
echo (Exemplo — nao executa automaticamente)
echo curl -i -X PATCH http://localhost:3000/connections/ID -H "Authorization: Bearer %MONITOR_TOKEN%" -H "Content-Type: application/json" -d "{\"status\":\"ACCEPTED\"}"
pause
