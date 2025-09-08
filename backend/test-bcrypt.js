const bcrypt = require('bcryptjs');

async function testBcrypt() {
    try {
        const password = 'test123';
        const hash = await bcrypt.hash(password, 12);
        console.log('✅ Hash generado:', hash);
        
        const isValid = await bcrypt.compare(password, hash);
        console.log('✅ Verificación:', isValid);
        
        console.log('🎉 bcryptjs funciona correctamente!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testBcrypt();
