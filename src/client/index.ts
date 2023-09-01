import {
    Keypair,
    Connection,
    PublicKey,
    LAMPORTS_PER_SOL,
    SystemProgram,
    TransactionInstruction,
    Transaction,
    sendAndConfirmTransaction,
} from '@solana/web3.js';
import fs from 'fs';
import { Buffer } from 'buffer';



async function main() {
    let connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    console.log(`Successfully connected to Solana dev net.`);

    const signerSecretKeyString = fs.readFileSync('src/client/signer.json', {encoding: 'utf8'});
    const signerSecretKey = Uint8Array.from(JSON.parse(signerSecretKeyString));
    let signerKeypair = Keypair.fromSecretKey(signerSecretKey);

    console.log(`Local account loaded successfully.`);
    console.log(`Local account's address is:`);
    console.log(`   ${signerKeypair.publicKey}`);

    const programSecretKeyString = fs.readFileSync('dist/program/memo-keypair.json', {encoding: 'utf8'});
    const programSecretKey = Uint8Array.from(JSON.parse(programSecretKeyString));
    let programKeypair = Keypair.fromSecretKey(programSecretKey);
    let programId = programKeypair.publicKey;

    console.log(`We're going to call the memo program.`);
    console.log(`It's Program ID is:`);
    console.log(`   ${programId.toBase58()}`)

    const SEED = 'data_account';
    let dataAccountPubKey = await PublicKey.createWithSeed(
        signerKeypair.publicKey,
        SEED,
        programId,
    );
    console.log(`The generated address is:`);
    console.log(`   ${dataAccountPubKey.toBase58()}`);

    const clientAccount = await connection.getAccountInfo(dataAccountPubKey);
    if (clientAccount === null) {

        console.log(`Looks like that account does not exist. Let's create it.`);

        const transaction = new Transaction().add(
            SystemProgram.createAccountWithSeed({
                fromPubkey: signerKeypair.publicKey,
                basePubkey: signerKeypair.publicKey,
                seed: SEED,
                newAccountPubkey: dataAccountPubKey,
                lamports: LAMPORTS_PER_SOL / 10,
                space: 512,
                programId,
            }),
        );
        await sendAndConfirmTransaction(connection, transaction, [signerKeypair]);

        console.log(`Client account created successfully.`);
    } else {
        console.log(`Looks like that account exists already. We can just use it.`);
    }

    const instruction = new TransactionInstruction({
        keys: [{pubkey: dataAccountPubKey, isSigner: false, isWritable: true}],
        programId,
        data: Buffer.from(process.argv.slice(2)[0], 'utf8'), // Empty instruction data
    });
    await sendAndConfirmTransaction(
        connection,
        new Transaction().add(instruction),
        [signerKeypair],
    );

    console.log(`Call ${process.argv.slice(2)[0]} successful.`);
}

main()