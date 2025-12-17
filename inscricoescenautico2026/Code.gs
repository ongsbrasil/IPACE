// Ensures headers (row 1) match expected order and column count
function ensureHeaders(sheet) {
  const headers = [
    'Timestamp',
    'Responsável Nome',
    'Responsável Nome Social',
    'Responsável CPF',
    'Responsável RG',
    'Responsável Email',
    'Contato 1',
    'Contato 2',
    'Endereço',
    'Número',
    'Bairro',
    'Cidade',
    'Escola',
    'Aluno Nome',
    'Aluno Nome Social',
    'Aluno Sexo',
    'Aluno Nascimento',
    'Aluno Idade',
    'Aluno CPF',
    'Aluno RG',
    'Modalidade',
    'Período',
    'CID',
    'Embarque',
    'Rematrícula',
    'Informativo OK',
    'Autorização OK'
  ];

  // Expand columns FIRST if needed
  while (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), 1);
  }

  // Check if headers already exist (row 1 not empty)
  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const hasHeaders = firstRow.some(cell => cell && cell.toString().trim().length > 0);

  if (!hasHeaders) {
    // Only set headers if row 1 is completely empty
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function doPost(e) {
  try {
    if (!e || !e.parameter) {
      return ContentService.createTextOutput(
        JSON.stringify({ status: 'error', message: 'No parameters received' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Inscricoes') || ss.getActiveSheet();
    
    // Ensure headers and columns exist FIRST
    ensureHeaders(sheet);
    
    // Wait a moment for column expansion to finish
    Utilities.sleep(100);

    const p = e.parameter;
    const now = new Date();

    // Build row array with exactly 27 columns (matching headers)
    const row = [
      now,                                    // 1. Timestamp
      p.responsavel_nome || '',              // 2. Responsável Nome
      p.responsavel_nome_social || '',       // 3. Responsável Nome Social
      p.responsavel_cpf || '',               // 4. Responsável CPF
      p.responsavel_rg || '',                // 5. Responsável RG
      p.responsavel_email || '',             // 6. Responsável Email
      p.contato1 || '',                      // 7. Contato 1
      p.contato2 || '',                      // 8. Contato 2
      p.endereco || '',                      // 9. Endereço
      p.numero || '',                        // 10. Número
      p.bairro || '',                        // 11. Bairro
      p.cidade || '',                        // 12. Cidade
      p.escola || '',                        // 13. Escola
      p.aluno_nome || '',                    // 14. Aluno Nome
      p.aluno_nome_social || '',             // 15. Aluno Nome Social
      p.aluno_sexo || '',                    // 16. Aluno Sexo
      p.aluno_nascimento || '',              // 17. Aluno Nascimento
      p.aluno_idade || '',                   // 18. Aluno Idade
      p.aluno_cpf || '',                     // 19. Aluno CPF
      p.aluno_rg || '',                      // 20. Aluno RG
      p.modalidade || '',                    // 21. Modalidade
      p.periodo || '',                       // 22. Período
      p.cid || '',                           // 23. CID
      p.embarque || '',                      // 24. Embarque
      p.rematricula || '',                   // 25. Rematrícula
      p.informativo_ok || 'Não',             // 26. Informativo OK
      p.autorizacao_ok || 'Não'              // 27. Autorização OK
    ];

    // Append row to sheet
    sheet.appendRow(row);

    return ContentService.createTextOutput(
      JSON.stringify({ status: 'success', message: 'Dados salvos com sucesso!' })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok', message: 'Web App deployed' })
  ).setMimeType(ContentService.MimeType.JSON);
}
