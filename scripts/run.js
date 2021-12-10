const main = async () => {
  // Deploy
    const [owner, randomPerson] = await hre.ethers.getSigners();
    const votingContractFactory = await hre.ethers.getContractFactory('Voting');
    const votingContract = await votingContractFactory.deploy({
      value: hre.ethers.utils.parseEther('0.1'),
    });

    await votingContract.deployed();
    console.log("Contract deployed to:", votingContract.address);
    console.log("Contract deployed by:", owner.address);

    /*
    * Get Contract balance
    */
    let contractBalance = await hre.ethers.provider.getBalance(
      votingContract.address
    );

    console.log(
      'Contract balance:',
      hre.ethers.utils.formatEther(contractBalance)
    );
  };
  
  const runMain = async () => {
    try {
      await main();
      process.exit(0);
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  };
  
  runMain();
  