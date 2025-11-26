Testes rápidos para endpoints de Conexões

Como usar

- Defina as variáveis de ambiente (Windows cmd):

```
set ALUNO_TOKEN=eyJhbGciOiJI...
set MONITOR_TOKEN=eyJhbGciOiJI...
```

- Execute o script de testes:

```
cd backend
scripts\test-connections.cmd
```

O script faz:
- POST /connections (cria uma solicitação do aluno para `monitor_id=1`)
- GET /connections/aluno (lista solicitações enviadas pelo aluno)
- GET /connections/monitor (lista solicitações recebidas pelo monitor)

Observação:
- Para aceitar/recusar uma solicitação, use o comando curl mostrado no final do script substituindo `<ID>` pelo id da solicitação.
