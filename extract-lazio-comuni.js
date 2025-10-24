// Script per estrarre i comuni del Lazio dal dataset nazionale
import fs from 'fs';
import https from 'https';

console.log('📥 Scaricamento dataset comuni italiani...');

const url = 'https://raw.githubusercontent.com/matteocontrini/comuni-json/master/comuni.json';

https.get(url, (res) => {
  let data = '';
  
  res.on('data', chunk => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      console.log('✅ Dataset scaricato con successo');
      const comuni = JSON.parse(data);
      console.log(`📊 Totale comuni in Italia: ${comuni.length}`);
      
      // Filtra solo i comuni del Lazio
      const comuniLazio = comuni.filter(comune => 
        comune.regione.nome === 'Lazio'
      );
      
      console.log(`🏛️ Comuni del Lazio trovati: ${comuniLazio.length}`);
      
      // Raggruppa per provincia
      const perProvincia = {};
      comuniLazio.forEach(comune => {
        const prov = comune.provincia.nome;
        if (!perProvincia[prov]) perProvincia[prov] = [];
        perProvincia[prov].push(comune.nome);
      });
      
      console.log('\n📍 Distribuzione per provincia:');
      Object.entries(perProvincia).forEach(([prov, comuni]) => {
        console.log(`   ${prov}: ${comuni.length} comuni`);
      });
      
      // Salva il file con i comuni del Lazio
      const lazioData = {
        regione: 'Lazio',
        totaleComuni: comuniLazio.length,
        province: perProvincia,
        comuni: comuniLazio.map(comune => ({
          nome: comune.nome,
          provincia: comune.provincia.nome,
          sigla: comune.provincia.sigla || comune.sigla,
          cap: comune.cap,
          popolazione: comune.popolazione,
          codiceCatastale: comune.codiceCatastale
        }))
      };
      
      fs.writeFileSync(
        '/Users/angelomontini/Documents/api-coordinate/comuni-lazio.json', 
        JSON.stringify(lazioData, null, 2)
      );
      
      console.log('\n✅ File comuni-lazio.json creato con successo!');
      
      // Mostra alcuni esempi
      console.log('\n🌟 Primi 10 comuni del Lazio:');
      comuniLazio.slice(0, 10).forEach(comune => {
        console.log(`   - ${comune.nome} (${comune.provincia.sigla}) - ${comune.popolazione.toLocaleString()} abitanti`);
      });
      
    } catch (error) {
      console.error('❌ Errore nel parsing JSON:', error.message);
    }
  });
  
}).on('error', (err) => {
  console.error('❌ Errore nel download:', err.message);
});