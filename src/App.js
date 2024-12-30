import { useState, useEffect } from 'react';
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { Program, AnchorProvider, utils, web3 } from '@project-serum/anchor';
import idl from './idl.json'; // Your IDL JSON file
import BN from 'bn.js'; // Import BN from the bn.js package
import { Buffer } from 'buffer';

window.Buffer = Buffer;

const programID = new PublicKey(idl.address); // Your program ID from the IDL
const network = "https://api.devnet.solana.com"; // Solana Devnet URL

const App = () => {
    const [walletAddress, setWalletAddress] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [newCampaignName, setNewCampaignName] = useState('');
    const [newCampaignDescription, setNewCampaignDescription] = useState('');
    const [donationAmount, setDonationAmount] = useState('');
    const [campaignId, setCampaignId] = useState('');

    // Function to fetch campaigns from the blockchain
    const fetchCampaigns = async() => {
        const provider = getProvider();
        const program = new Program(idl, programID, provider);

        try {
            const campaigns = await program.account.campaign.all(); // Get all campaign accounts
            setCampaigns(campaigns);
        } catch (err) {
            console.error('Error fetching campaigns:', err);
        }
    };

    // This function will connect to the Phantom wallet
    const connectWallet = async() => {
        const { solana } = window;
        if (solana) {
            const response = await solana.connect();
            setWalletAddress(response.publicKey.toString());
        } else {
            alert("Please install Phantom wallet.");
        }
    };

    // Get the provider (to interact with the Solana network)
    const getProvider = () => {
        const connection = new Connection(network);
        const provider = new AnchorProvider(connection, window.solana, { preflightCommitment: 'processed' });
        return provider;
    };

    // Create a campaign function
    const createCampaign = async() => {
        const provider = getProvider();
        const program = new Program(idl, programID, provider);

        try {
            const [campaign, bump] = await PublicKey.findProgramAddress(
                [utils.bytes.utf8.encode("CAMPAIGN_DEMO"), provider.wallet.publicKey.toBuffer()],
                program.programId
            );

            await program.rpc.createCampaign(newCampaignName, newCampaignDescription, {
                accounts: {
                    campaign,
                    user: provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                },
            });

            alert('Campaign Created');
        } catch (err) {
            console.error('Error creating campaign:', err);
        }
    };

    // Function to donate to a campaign
    const donateToCampaign = async() => {
        const provider = getProvider();
        const program = new Program(idl, programID, provider);

        const campaignPublicKey = new PublicKey(campaignId); // Convert campaignId to PublicKey

        try {
            await program.rpc.donate(new BN(donationAmount), {
                accounts: {
                    campaign: campaignPublicKey,
                    user: provider.wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                },
            });

            alert('Donation successful!');
        } catch (err) {
            console.error('Error donating:', err);
        }
    };

    // Withdraw function (admin only)
    const withdrawFromCampaign = async() => {
        const provider = getProvider();
        const program = new Program(idl, programID, provider);

        const campaignPublicKey = new PublicKey(campaignId); // Convert campaignId to PublicKey

        try {
            await program.rpc.withdraw(new BN(donationAmount), {
                accounts: {
                    campaign: campaignPublicKey,
                    user: provider.wallet.publicKey,
                },
            });

            alert('Withdrawal successful!');
        } catch (err) {
            console.error('Error withdrawing:', err);
        }
    };

    // UseEffect to load campaigns when component mounts
    useEffect(() => {
        if (walletAddress) {
            fetchCampaigns(); // Call the function to fetch campaigns
        }
    }, [walletAddress]);

    return ( <
        div className = "App" >
        <
        button onClick = { connectWallet } > { walletAddress ? `Connected: ${walletAddress}` : 'Connect Wallet' } <
        /button>

        <
        div >
        <
        h3 > Create Campaign < /h3> <
        input type = "text"
        placeholder = "Campaign Name"
        value = { newCampaignName }
        onChange = {
            (e) => setNewCampaignName(e.target.value) }
        /> <
        input type = "text"
        placeholder = "Campaign Description"
        value = { newCampaignDescription }
        onChange = {
            (e) => setNewCampaignDescription(e.target.value) }
        /> <
        button onClick = { createCampaign } > Create Campaign < /button> <
        /div>

        <
        div >
        <
        h3 > Donate to Campaign < /h3> <
        input type = "text"
        placeholder = "Campaign ID"
        value = { campaignId }
        onChange = {
            (e) => setCampaignId(e.target.value) }
        /> <
        input type = "number"
        placeholder = "Amount"
        value = { donationAmount }
        onChange = {
            (e) => setDonationAmount(e.target.value) }
        /> <
        button onClick = { donateToCampaign } > Donate < /button> <
        /div>

        <
        div >
        <
        h3 > Withdraw from Campaign < /h3> <
        input type = "text"
        placeholder = "Campaign ID"
        value = { campaignId }
        onChange = {
            (e) => setCampaignId(e.target.value) }
        /> <
        input type = "number"
        placeholder = "Amount"
        value = { donationAmount }
        onChange = {
            (e) => setDonationAmount(e.target.value) }
        /> <
        button onClick = { withdrawFromCampaign } > Withdraw < /button> <
        /div>

        <
        div >
        <
        h3 > Campaigns < /h3> <
        ul > {
            campaigns.map((campaign, index) => ( <
                li key = { index } > { campaign.account.name } - { campaign.account.description } - { campaign.account.amountDonated } <
                /li>
            ))
        } <
        /ul> <
        /div> <
        /div>
    );
};

export default App;