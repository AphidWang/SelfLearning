import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const yamlDir = path.join(__dirname, '../src/lib/ai/config');
const jsonDir = path.join(__dirname, '../src/lib/ai/config');

// 確保目標目錄存在
if (!fs.existsSync(jsonDir)) {
  fs.mkdirSync(jsonDir, { recursive: true });
}

// 讀取所有 YAML 文件
const yamlFiles = fs.readdirSync(yamlDir).filter(file => file.endsWith('.yaml'));

yamlFiles.forEach(yamlFile => {
  const yamlPath = path.join(yamlDir, yamlFile);
  const jsonFile = yamlFile.replace('.yaml', '.json');
  const jsonPath = path.join(jsonDir, jsonFile);

  // 讀取 YAML 並轉換為 JSON
  const yamlContent = fs.readFileSync(yamlPath, 'utf8');
  const jsonContent = JSON.stringify(yaml.load(yamlContent), null, 2);

  // 寫入 JSON 文件
  fs.writeFileSync(jsonPath, jsonContent);
  console.log(`Converted ${yamlFile} to ${jsonFile}`);
}); 