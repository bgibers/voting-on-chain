//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Voting is Ownable{
    uint public currentProposal;
    mapping(address => bool) public voters; // Map of all users allowed to vote and their vote on the current proposal
    mapping(uint256 => Proposal) public proposals;

    struct Proposal {
        uint proposalId; // unique id of proposal
        uint votesFor; // # of voters in favor
        uint vetoVotes; // # of voters against
        uint proposedTimestamp; // The timestamp when proposal was made
        string proposal; // The message the user sent.
        bool isFinished; 
    }

    constructor() {
    }

    function createProposal(string memory proposal) public onlyOwner {
        // check if current proposal has ended before allowing creation of another
        require(proposals[currentProposal].isFinished);
    }

    function isCurrentProposalFinished() public returns(bool) {

    }

    /*
        Owner should be able to make proposals
        List of voters
        Once all voters vote, or the time period is reached the vote is over
        All propasals are stored in an object
        Each user should only be allowed to vote once per proposal 
            - the user object will contain a list of all proposals voted on
        Ability to get vote count for a proposal 
    */
}
