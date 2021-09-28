const Web3 = require('web3');
const url = 'https://rpc.ftm.tools/';
const web3 = new Web3(url);
const ethers = require('ethers');
const { JsonRpcProvider } = require("@ethersproject/providers");
require("dotenv").config();

const { contractAddresses } = require('../contracts/contracts');

const secretKey = process.env.SECRETKEY;
const walletAddress = process.env.WALLETADDRESS;
const maxGasPx = process.env.MAXGAS;
const provider = new JsonRpcProvider(url);
const classes = ['noClass', 'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rouge', 'Sorcerer', 'Wizard'];

if (!process.argv[2] || isNaN(process.argv[2])) {
	console.error('Please provide the number of summoner to create as fist argument ex: \n\n- node index.js 30');
	process.exit(1);
}

const wallet = ethers.Wallet.fromMnemonic(secretKey);
const account = wallet.connect(provider);
const maxGasPrice = ethers.utils.parseUnits(maxGasPx.toString(), 9);
const totalGasLimit = 125000;


const calculateGasPrice = async () => {
	let spotPx = await web3.eth.getGasPrice();
	let spotPxBN = ethers.BigNumber.from(spotPx.toString())
	if (spotPxBN.gte(maxGasPrice)) {
		return -(Math.floor(spotPx / (10**9)))
	} else {
		return spotPxBN
	}
}

const nonceVal = async () => {
	baseNonce = await provider.getTransactionCount(walletAddress, "pending");
	return baseNonce
}

const createSummon = async (classId, nonceToUse) => {
	let thisGas = await calculateGasPrice()

	if (thisGas < 0) {
		console.log(`Gas Price too high: ${-thisGas}`)
		return [false, 'high gas']
	} else {
		let contract = new ethers.Contract(contractAddresses.rarityManifested, contractAddresses.manifestABI, account);
		let approveResponse = await contract.summon(
			classId,
			{
				gasLimit: totalGasLimit,
				gasPrice: thisGas,
				nonce: nonceToUse
			});
		// console.log(approveResponse);
		return [true, 'success'];
	}
}

const main = async () => {
	let i = -1;
	let nonceToUse = await nonceVal();
	while (++i <= process.argv[2]) {
		// get random class
		let newSummonerClassId = classes.indexOf(classes[Math.floor(Math.random() * classes.length)]);
		if (newSummonerClassId === 0) newSummonerClassId = 1
		try {
			await createSummon(newSummonerClassId, nonceToUse);
			nonceToUse++
		} catch(e) {
			// console.error(e);
		}
	}
}

main()
