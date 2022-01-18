const { expect } = require("chai");
const { ethers } = require("hardhat");

let voteContractFactory;
let voteContract;
let owner;
let voter1;
let voter2;
let voter3;
let voter4;
let voter5;
let addrs;

beforeEach(async function () {
  voteContractFactory = await ethers.getContractFactory('Voting');
  [owner, voter1, voter2, voter3, voter4, voter5] = await ethers.getSigners();

  voteContract = await voteContractFactory.deploy({});
  await voteContract.deployed();
});

describe("Deployment", function() {
  it("Should set the right owner", async function() {
      expect(await voteContract.owner()).to.equal(owner.address);
  });

  it("Owner should be in the initial voters list", async function() {
    expect(await voteContract.getVoters()).to.contain(owner.address);
  }); 

  it("Owner initial vote should be false" , async function() {
    expect(await voteContract.didVoterVoteOnCurrentProposal(owner.address)).to.equal(false);
  }); 


  it("Voter count = 1 and voted count = 0", async function() {
    expect(await voteContract.voterCount()).to.equal(1); 
    expect(await voteContract.votedCount()).to.equal(0); 
  }); 
});

describe("Only owner functions", function() {
  it("Should be able to create a proposal", async function() {
    await voteContract.createProposal(ethers.utils.formatBytes32String('Test'), 'A test proposal', 1);
    expect(ethers.utils.parseBytes32String(await voteContract.getCurrentProposal())).to.equal('Test');
  }); 

  it("Should be able to set a proposal time", async function() {
    await voteContract.setProposalTime(1);
    expect(await voteContract.timeToVote()).to.equal(60);
  }); 


  it("Should be able to add a voter", async function() {
    await voteContract.addVoter(voter2.address);
    expect(await voteContract.getVoters()).to.contain(voter2.address);
  }); 


  it("Other user should not be able to create a proposal", async function() {
    const acc = voter2.address;

    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [acc]
    });

    const impersonatedAccount = await ethers.provider.getSigner(acc);
    voteContract.connect(impersonatedAccount);

    expect(await voteContract.owner()).to.not.equal(acc);  
    expect(voteContract.createProposal(ethers.utils.formatBytes32String('Test'), 'A test proposal', 1)).to.be.revertedWith('Ownable: caller is not the owner');

    await network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [acc]
    });
  }); 
  
});

describe("Proposals", function() {
  it("Should NOT be able to create a proposal while the other is underway", async function() {
    expect(await voteContract.owner()).to.equal((await ethers.getSigners())[0].address);  
  }); 

  // it("Should NOT be able to create a proposal if ID is not unique", async function() {
   
  // });

  // it("Should be able to create proposal after expiration time", async function() {
   
  // });

  // it("Should be able to create a proposal after all voters have finished", async function() {
   
  // });
});

describe("Voting", function() {
  // it("Should NOT be able to vote twice", async function() {
   
  // }); 

  // it("Should NOT be able to vote when there is no proposal underway", async function() {
   
  // });

});

