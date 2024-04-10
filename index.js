const fs = require('fs').promises;
const path = require('path');

const check_eng = /^[a-zA-Z]*$/;
const check_projectName = /^[a-zA-Z_\- ]*$/;
const check_spc = /[~!@#$%^&*()_+|<>?:{}]/;

class Settings {
  constructor(comment, key, value) {
    this.comment = comment;
    this.key = key;
    this.value = value;
  }
}

function isEmpty(value) {
  if (value == "" || value == null || value == undefined) {
    return true;
  } else {
    return false;
  }
}

async function checkDirectoryExists(directoryPath) {
  try {
    await fs.access(directoryPath, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

function overMax(value, max) {
  if (value.length > max) {
    return false;
  } else {
    return true;
  }
}

// Function to replace phrase in a file
async function replacePhrase(filePath, oldPhrase, newPhrase) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const newData = data.replace(new RegExp(oldPhrase, 'g'), newPhrase);
    if (data !== newData) {
      await fs.writeFile(filePath, newData, 'utf8');
      console.log(`Replaced "${oldPhrase}" with "${newPhrase}" in ${filePath}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}: ${err.message}`);
  }
}

// Function to process a directory
async function processDirectory(folderPath, oldPhrase, newPhrase) {
  const files = await fs.readdir(folderPath);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stats = await fs.stat(filePath);
    const extname = path.extname(file);

    // Skip media files
    if (['.jpg', '.jpeg', '.png', '.gif', '.mp3', '.mp4', '.svg', '.webp', '.apng', 'ico'].includes(extname.toLowerCase())) {
      // console.log(`is Media: ${filePath}`);
      continue;
    }


    if (stats.isDirectory()) {
      await processDirectory(filePath, oldPhrase, newPhrase)
    } else if (stats.isFile()) {
      await replacePhrase(filePath, oldPhrase, newPhrase);
    }
  }
}


function getSettingsList(settingsFile) {
  const settingsRawList = settingsFile.replace(new RegExp('import \'package:(.*);', 'g'), '').split(';');
  let settingsList = [];
  for (let i = 0; i < settingsRawList.length; i++) {
    const componants = settingsRawList[i].split(/const|=/);
    const comment = componants[0] == undefined ? '' : componants[0].trim();
    const key = componants[1] == undefined ? '' : componants[1].trim();
    const value = componants[2] == undefined ? '' : componants[2].trim();
    if (key !== '' && value !== '') {
      settingsList.push(new Settings(comment, key, value));
    }

  }
  return settingsList;
}

function getNewCumtomSettingsStr(importsList, newCustomSettingsList, userCustomSettingsList) {
  let newUserCustomSettingsStr = '';

  for (let i = 0; i < importsList.length; i++) {
    newUserCustomSettingsStr += `${importsList[i]}\n`
  }

  for (let i = 0; i < newCustomSettingsList.length; i++) {
    for (let k = 0; k < userCustomSettingsList.length; k++) {
      if (newCustomSettingsList[i].key == userCustomSettingsList[k].key) {
        newUserCustomSettingsStr += `\n\n${userCustomSettingsList[k].comment}\nconst ${userCustomSettingsList[k].key} = ${userCustomSettingsList[k].value};`
        break;
      }

      if (k == userCustomSettingsList.length - 1 && newCustomSettingsList[i].key !== userCustomSettingsList[k].key) {
        newUserCustomSettingsStr += `\n\n${newCustomSettingsList[i].comment}\nconst ${newCustomSettingsList[i].key} = ${newCustomSettingsList[i].value};`
        break;
      }
    }
  }

  newUserCustomSettingsStr = newUserCustomSettingsStr.replace(new RegExp('\n\n\n', 'g'), '\n\n');

  return newUserCustomSettingsStr;
}

async function copyFiles(sourceDir, destinationDir) {
  try {
      const files = await fs.readdir(sourceDir);
      
      for (const file of files) {
          const sourceFile = path.join(sourceDir, file);
          const destinationFile = path.join(destinationDir, file);

          await fs.copyFile(sourceFile, destinationFile);
          console.log(`copied ${file} to ${destinationDir}`);
      }
  } catch (err) {
      console.error('Error moving files:', err);
  }
}

// Function to parse command line arguments
function parseArgs(args) {
  const options = {};
  // like --key=value
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const [key, value] = arg.split('=');
    if (key.startsWith('--')) {
      options[key.slice(2)] = value;
    } else {
      options[key.slice(1)] = value;
    }
  }
  // like -key value
  /*
  let currentOption = null;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('-')) {
      currentOption = arg.slice(1);
      options[currentOption] = '';
    } else if (currentOption !== null) {
      options[currentOption] = arg;
      currentOption = null;
    }
  }
  */
  return options;
}

// Get command-line arguments
const command = process.argv.slice(2, 3);
const args = process.argv.slice(3); // Skip first two arguments (node and script filename)

// Parse arguments
const options = parseArgs(args);

// define defalut names
const amMainName = 'applimode-main';
const amAndBundleId = 'applimode.my_applimode';
const amIosBundleId = 'applimode.myApplimode'
const amUniName = 'my_applimode';
const amCamelName = 'myApplimode';
const amFullName = 'My Applimode';
const amShortName = 'AMB';
const amFbName = 'my-applimode';
const amOrgnizationName = 'applimode';
const amWorkerKey = 'yourWorkerKey';
const amMainColor = 'FCB126';

// Extract arguments or use default values if not provided
const userProjectName = options['project-name'] || options['p']; // || amUniName;
const userFullName = options['full-name'] || options['f'] || userProjectName; // || amFullName;
const userShortName = options['short-name'] || options['s'] || userFullName || userProjectName; // || amShortName;
const userOrganizationName = options['organization-name'] || options['o'] || amOrgnizationName; // || 'applimode';
const userFirebaseName = options['firebase-name'] || options['b']; // || amFbName;
const userProjectFolderName = options['directory-name'] || options['d'];
const userCloudflareWorkerKey = options['worker-key'] || options['w'];
const userMainColor = options['main-color'] || options['c'];
const amMainDirectoryName = options['main-name'] || options['m'] || amMainName;

const projectsPath = './../';
const amMainRootPath = `./../${amMainDirectoryName}`;
const amMainLibPath = `${amMainRootPath}/lib`
const organizationPath = `${amMainRootPath}/android/app/src/main/kotlin/com`
const andBundleIdPath = `${amMainRootPath}/android/app/src/main/kotlin/com/applimode`

const customSettingsFile = 'custom_settings.dart';
const envFile = '.env';

// init applimode
async function initApplimode() {
  // check the parameters are empty
  if (isEmpty(userProjectName) || isEmpty(userFirebaseName)) {
    console.log('Enter the project name and Firebase project id.\n프로젝트이름, 파이어베이이스 프로젝트ID를 입력하세요.');
    return;
  }

  // check english
  if (!check_projectName.test(userProjectName) || !check_eng.test(userOrganizationName)) {
    console.log('Project name, organization name, and Firebase project name are only available in English.\n프로젝트이름, 조직이름, 파이어베이이스 프로젝트이름은 영어만 가능합니다.');
    return;
  }
  
  // check the main directory exists
  const checkMainDirectory = await checkDirectoryExists(amMainRootPath);
  if (!checkMainDirectory) {
    console.log(`The ${amMainDirectoryName} directory does not exist.\n${amMainDirectoryName} 디렉토리가 존재하지 않습니다.`);
    return;
  }

  const splits = userProjectName.split(/ |_|-/);

  const appFullName = userFullName.trim();
  const appShortName = userShortName.trim();
  const appOrganizationName = userOrganizationName.toLowerCase().trim();
  const appFirebaseName = userFirebaseName.trim();

  let underbarName = '';
  let camelName = '';
  let andBundleId = '';
  let iosBundleId = '';

  for (let i = 0; i < splits.length; i++) {
    let word = splits[i].toLowerCase().trim();
    if (i == 0) {
      underbarName += word;
      camelName += word;
    } else {
      underbarName += `_${word}`;
      let firstChar = word.charAt(0);
      let others = word.slice(1);
      camelName += firstChar.toUpperCase() + others;
    }
  }
  andBundleId = `${appOrganizationName}.${underbarName}`;
  iosBundleId = `${appOrganizationName}.${camelName}`;

  await processDirectory(amMainRootPath, amAndBundleId, andBundleId);
  await processDirectory(amMainRootPath, amIosBundleId, iosBundleId);
  await processDirectory(amMainRootPath, amUniName, underbarName);
  await processDirectory(amMainRootPath, amCamelName, camelName);
  await processDirectory(amMainRootPath, amFullName, appFullName);
  await processDirectory(amMainRootPath, amShortName, appShortName);
  await processDirectory(amMainRootPath, amFbName, appFirebaseName);

  if (!isEmpty(userCloudflareWorkerKey)) {
    await processDirectory(amMainRootPath, amWorkerKey, userCloudflareWorkerKey);
  }

  if (!isEmpty(userMainColor)) {
    await processDirectory(amMainRootPath, amMainColor, userMainColor);
  }

  await fs.rename(path.join(andBundleIdPath, amUniName), path.join(andBundleIdPath, underbarName));
  await fs.rename(path.join(organizationPath, amOrgnizationName), path.join(organizationPath, appOrganizationName));
  await fs.rename(path.join(projectsPath, amMainDirectoryName), path.join(projectsPath, underbarName));

  console.log('Applimode initialization was successful.');
}

// upgrade applimode
async function upgradeApplimode() {
  // check the parameters are empty
  if (isEmpty(userProjectFolderName)) {
    console.log('Enter the project folder name.\n프로젝트 폴더 이름을 입력하세요.');
    return;
  }

  const newRootPath = amMainRootPath;
  const userRootPath = `./../${userProjectFolderName}`;
  const newLibPath = amMainLibPath;
  const userLibPath = `${userRootPath}/lib`;
  const newImagesPath = `${amMainRootPath}/assets/images`;
  const userImagesPath = `${userRootPath}/assets/images`;

  // check the main directory exists
  const checkMainDirectory = await checkDirectoryExists(amMainRootPath);
  if (!checkMainDirectory) {
    console.log('The applimod-main directory does not exist.\napplimod-main 디렉토리가 존재하지 않습니다.');
    return;
  }

  // check the project directory exists
  const checkProjectDirectory = await checkDirectoryExists(userRootPath);
  if (!checkProjectDirectory) {
    console.log('Your project directory does not exist.\n지정한 프로젝트 디렉토리가 존재하지 않습니다.');
    return;
  }

  const newEnvPath = path.join(newRootPath, envFile);
  const userEnvPath = path.join(userRootPath, envFile);
  const newCustomSettingsPath = path.join(newLibPath, customSettingsFile);
  const userCustomSettingsPath = path.join(userLibPath, customSettingsFile);

  // const newEnvFile = await fs.readFile(newEnvPath, 'utf8');
  const userEnvFile = await fs.readFile(userEnvPath, 'utf8');
  const newCustomSettingsFile = await fs.readFile(newCustomSettingsPath, 'utf8');
  const userCustomSettingsFile = await fs.readFile(userCustomSettingsPath, 'utf8');

  let fullAppName = '';
  let shortAppName = '';
  let underbarAppName = '';
  let camelAppName = '';
  let androidBundleId = '';
  let appleBundleId = '';
  let firebaseProjectName = '';
  let mainColor = '';

  const importsList = newCustomSettingsFile.match(new RegExp('import \'package:(.*);', 'g'));

  const newCustomSettingsList = getSettingsList(newCustomSettingsFile);
  const userCustomSettingsList = getSettingsList(userCustomSettingsFile);

  for (let i = 0; i < userCustomSettingsList.length; i++) {
    if (userCustomSettingsList[i].key == 'fullAppName') {
      fullAppName = userCustomSettingsList[i].value.replace(new RegExp(/['"]/, 'g'), '').trim();
    }
    if (userCustomSettingsList[i].key == 'shortAppName') {
      shortAppName = userCustomSettingsList[i].value.replace(new RegExp(/['"]/, 'g'), '').trim();
    }
    if (userCustomSettingsList[i].key == 'underbarAppName') {
      underbarAppName = userCustomSettingsList[i].value.replace(new RegExp(/['"]/, 'g'), '').trim();
    }
    if (userCustomSettingsList[i].key == 'camelAppName') {
      camelAppName = userCustomSettingsList[i].value.replace(new RegExp(/['"]/, 'g'), '').trim();
    }
    if (userCustomSettingsList[i].key == 'androidBundleId') {
      androidBundleId = userCustomSettingsList[i].value.replace(new RegExp(/['"]/, 'g'), '').trim();
    }
    if (userCustomSettingsList[i].key == 'appleBundleId') {
      appleBundleId = userCustomSettingsList[i].value.replace(new RegExp(/['"]/, 'g'), '').trim();
    }
    if (userCustomSettingsList[i].key == 'firebaseProjectName') {
      firebaseProjectName = userCustomSettingsList[i].value.replace(new RegExp(/['"]/, 'g'), '').trim();
    }
    if (userCustomSettingsList[i].key == 'spareMainColor') {
      mainColor = userCustomSettingsList[i].value.replace(new RegExp(/['"]/, 'g'), '').trim();
    }
  }

  const organizationName = androidBundleId.replace(`.${underbarAppName}`, '').trim();

  // change names in docs
  await processDirectory(amMainRootPath, amAndBundleId, androidBundleId);
  await processDirectory(amMainRootPath, amIosBundleId, appleBundleId);
  await processDirectory(amMainRootPath, amUniName, underbarAppName);
  await processDirectory(amMainRootPath, amCamelName, camelAppName);
  await processDirectory(amMainRootPath, amFullName, fullAppName);
  await processDirectory(amMainRootPath, amShortName, shortAppName);
  await processDirectory(amMainRootPath, amFbName, firebaseProjectName);
  await processDirectory(amMainRootPath, amMainColor, mainColor);

  // applimode-main/android/app/src/main/kotlin/com/applimode/my_applimode/MainActivity.kt
  await fs.rename(path.join(andBundleIdPath, amUniName), path.join(andBundleIdPath, underbarAppName));
  await fs.rename(path.join(organizationPath, amOrgnizationName), path.join(organizationPath, organizationName));
  
  // generate custom_settings file
  const newUserCustomSettingsStr = getNewCumtomSettingsStr(importsList, newCustomSettingsList, userCustomSettingsList);
  await fs.writeFile(newCustomSettingsPath, newUserCustomSettingsStr, 'utf8');

  // generate .env file
  await fs.writeFile(newEnvPath, userEnvFile, 'utf8');

  // move images
  await copyFiles(userImagesPath, newImagesPath);

  // rename directories name
  await fs.rename(path.join(projectsPath, userProjectFolderName), path.join(projectsPath, `${userProjectFolderName}_old`));
  await fs.rename(path.join(projectsPath, amMainDirectoryName), path.join(projectsPath, userProjectFolderName));

  console.log('Applimode upgrade was successful.');
}

// Check if the folder exists
fs.access(projectsPath)
  .then(async () => {
    if (command[0].trim() == 'init') {
      await initApplimode();
    } else if (command[0].trim() == 'upgrade') {
      await upgradeApplimode();
    } else {
      console.error('Error:', 'The command must start with init or upgrade.\n명령어가 init 또는 upgrade로 시작해야합니다.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });


