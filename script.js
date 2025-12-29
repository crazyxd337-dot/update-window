let tesseractWorker = null;



async function copyInfo() {
    let text;
    try {
        text = await navigator.clipboard.read();
    }
    catch (err) {return []}
    return text
}

async function pasteResult(text) {
    try {
        await navigator.clipboard.writeText(text);
        console.log('✅ Текст скопирован:', text);
        return true;
    } catch (err) {
        console.error('❌ Ошибка копирования:', err);
        return false;
    }
}


function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            // reader.result = "data:image/png;base64,iVBORw0KGgo..."
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}


// Функция инициализации Tesseract
async function processImageWithTesseract(base64Image) {
    // Вариант A: Создание воркера каждый раз
    const worker = await Tesseract.createWorker('rus+eng');
    
    // Вариант B: Использование Data URL
    const result = await worker.recognize(
        `data:image/png;base64,${base64Image}`
    );
    
    console.log('Текст:', result.data.text);
    await worker.terminate();
    return result.data.text;
}

function checkIOstep() {
    document.addEventListener('keydown', async (e) => {
        console.log('Нажата клавиша', e.key);
        
        if (e.shiftKey && e.ctrlKey && e.altKey) {
            e.preventDefault(); // Добавьте это чтобы не мешало
            updateStatusTitlePending();
            try {
                const BUFFINFO = await copyInfo();
                
                if (!BUFFINFO || BUFFINFO.length === 0) {
                    console.log('Буфер пуст');
                    return;
                }
                
                console.log('Типы в буфере:', BUFFINFO[0].types);
                
                // 1. Получаем обработчик для типа
                const handler = findType(BUFFINFO);
                
                if (!handler || handler === 'none') {
                    console.log('Неподдерживаемый тип');
                    return;
                }
                
                console.log('Обработчик:', handler.description);
                
                // 2. Получаем данные через обработчик
                let data = await handler.getMethod(BUFFINFO[0]);
                
                // 3. Обрабатываем в зависимости от типа
                if (handler.description === 'изображение') {
                    // data = base64 строка
                    console.log('Изображение в base64, длина:', data.length);
                    
                    // 4. Распознаем текст
                    data = await processImageWithTesseract(data);
                    console.log('Распознанный текст:', data);
                    
                } else if (handler.description === 'Обычный текст') {
                    console.log('Текст:', data);
                }

                console.log(`в промт на API пойдет:`, data);
                
                const result = await askYandexGPT(data);
                pasteResult(result);
                updateStatusTitle(data);
                // console.log(result);
                
                
                
                
            } catch (err) {
                console.error('Ошибка:', err);
            }
            
            
        }
    });
}

function findType(ClipboardItem) {
    if (!ClipboardItem || ClipboardItem.length === 0) {
        return null;
    }
    
    const firstType = ClipboardItem[0].types[0];
    console.log('Первый тип:', firstType);
    
    const MethodObject = {
        'text/plain': {
            description: 'Обычный текст',
            getMethod: async (item) => {
                const blob = await item.getType('text/plain');
                return await blob.text();
            }
        },
        'image/png': {
            description: 'изображение',
            getMethod: async (item) => {
                const blob = await item.getType('image/png');
                return await blobToBase64(blob);
            }
        }
    };
    
    return MethodObject[firstType] || 'none';
}

// Дополнительно: улучшенная функция processImageWithTesseract
async function processImageWithTesseract(base64Image) {
    try {
        // Проверяем что Tesseract доступен
        if (typeof Tesseract === 'undefined') {
            throw new Error('Tesseract.js не загружен. Добавьте в HTML: <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>');
        }
        
        console.log('🔄 Создаю Tesseract воркер...');
        const worker = await Tesseract.createWorker('rus+eng');
        
        console.log('🔍 Распознаю текст...');
        const result = await worker.recognize(
            `data:image/png;base64,${base64Image}`
        );
        
        console.log('✅ Распознано символов:', result.data.text.length);
        await worker.terminate();
        
        return result.data.text;
        
    } catch (error) {
        console.error('❌ Ошибка OCR:', error);
        return `Ошибка распознавания: ${error.message}`;
    }
}



function updateStatusTitle(){
    document.getElementById('title').textContent = '✅';
}
function updateStatusTitlePending(){
    document.getElementById('title').textContent = '⏳';
}
document.addEventListener('DOMContentLoaded',() =>{
    checkIOstep();

    updateStatusTitle();
})

