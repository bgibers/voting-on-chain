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

  it("Should Not be able to add a voter", async function() {
    await voteContract.addVoter(voter2.address);
    expect(await voteContract.getVoters()).to.contain(voter2.address);
  }); 

  it("Other user should not be able to create a proposal", async function() {
    voteContract = voteContract.connect(voter2);
    await expect(voteContract.createProposal(ethers.utils.formatBytes32String('Test'), 'A test proposal', 1)).to.be.reverted;
  }); 
});

describe("Proposals", function() {
  it("Should NOT be able to create a proposal while the other is underway", async function() {
    await voteContract.createProposal(ethers.utils.formatBytes32String('Test'), 'A test proposal', 1);

    await expect(voteContract.createProposal(ethers.utils.formatBytes32String('Test2'), 'A test proposal 2', 1)).to.be.revertedWith("There is still a proposal underway");
  }); 

  it("Should be able to create proposal after expiration time", async function() {
    // 10 min expiration
    await voteContract.createProposal(ethers.utils.formatBytes32String('Test'), 'A test proposal', 10);

    // Add 9.9 mins to the next block timestamp and ensure it still fails
    await ethers.provider.send("evm_increaseTime", [60*9]);
    await ethers.provider.send("evm_mine");

    await expect(voteContract.createProposal(ethers.utils.formatBytes32String('Test2'), 'A test proposal 2', 1)).to.be.revertedWith("There is still a proposal underway");

    // add another minute. 10 mins total. should be able to create another proposal now
    await ethers.provider.send("evm_increaseTime", [60*1]);
    await ethers.provider.send("evm_mine");

    await expect(voteContract.createProposal(ethers.utils.formatBytes32String('Test2'), 'A test proposal 2', 1)).to.not.be.reverted;
  });

  it("Should NOT be able to create a proposal if ID is not unique", async function() {
    await voteContract.createProposal(ethers.utils.formatBytes32String('Test'), 'A test proposal', 1);

    // Add 15 mins to the next block timestamp to simulate the proposal expiring
    timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))["timestamp"];
    await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp+60*15]);
    await ethers.provider.send("evm_mine");

    await expect(voteContract.createProposal(ethers.utils.formatBytes32String('Test'), 'A test proposal 2', 1)).to.be.revertedWith("The proposal id must be unique");
  });

  it("Should be able to create a proposal after all voters have finished", async function() {
    await voteContract.createProposal(ethers.utils.formatBytes32String('Test'), 'A test proposal', 10);

    await voteContract.addVoter(voter1.address);
    await voteContract.addVoter(voter2.address);
    await voteContract.addVoter(voter3.address);
    await voteContract.addVoter(voter4.address);
    await voteContract.addVoter(voter5.address);

    expect(await voteContract.voterCount()).to.equal(6); 
    expect(await voteContract.votedCount()).to.equal(0); 

    voteContract = voteContract.connect(owner);
    await voteContract.vote(true);
    expect(await voteContract.votedCount()).to.equal(1); 

    voteContract = voteContract.connect(voter1);
    await voteContract.vote(true);
    expect(await voteContract.votedCount()).to.equal(2); 

    voteContract = voteContract.connect(voter2);
    await voteContract.vote(true);
    expect(await voteContract.votedCount()).to.equal(3); 

    voteContract = voteContract.connect(voter3);
    await voteContract.vote(true);
    expect(await voteContract.votedCount()).to.equal(4); 

    voteContract = voteContract.connect(voter4);
    await voteContract.vote(true);
    expect(await voteContract.votedCount()).to.equal(5); 

    voteContract = voteContract.connect(voter5);
    await voteContract.vote(true);
    expect(await voteContract.votedCount()).to.equal(6); 

    voteContract = voteContract.connect(owner);
    await voteContract.createProposal(ethers.utils.formatBytes32String('Test2'), 'A test proposal', 1);
  });

  it("Should have been a passed proposal", async function() {
    await voteContract.addVoter(voter1.address);
    await voteContract.addVoter(voter2.address);

    expect(await voteContract.voterCount()).to.equal(6); 
    expect(await voteContract.votedCount()).to.equal(0); 
  });

  it("Should have been a failed proposal", async function() {
    await voteContract.addVoter(voter1.address);
    await voteContract.addVoter(voter2.address);
    await voteContract.addVoter(voter3.address);
    await voteContract.addVoter(voter4.address);
    await voteContract.addVoter(voter5.address);

    expect(await voteContract.voterCount()).to.equal(6); 
    expect(await voteContract.votedCount()).to.equal(0); 
  });

  it("Should be able to get current proposal", async function() {

  }); 

  it("Should be able to see if a specific proposal passed", async function() {

  }); 
});

// describe("Voting", function() {
//   it("Should NOT be able to vote twice", async function() {
//     await voteContract.createProposal(ethers.utils.formatBytes32String('Test'), 'A test proposal', 1);

//     await voteContract.vote(true);
//     await expect(voteContract.vote(true)).to.be.revertedWith("User has already voted on this proposal");
//   }); 

//   it("Should NOT be able to vote when there is no proposal underway", async function() {
//     await voteContract.createProposal(ethers.utils.formatBytes32String('Test'), 'A test proposal', 1);

//     // Add 15 mins to the next block timestamp to simulate the proposal expiring
//     timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))["timestamp"];
//     await ethers.provider.send("evm_setNextBlockTimestamp", [timestamp+60*15]);
//     await ethers.provider.send("evm_mine");

//     await expect(voteContract.vote(true)).to.be.revertedWith("There currently isn't anything to vote on");
//   });
// });

