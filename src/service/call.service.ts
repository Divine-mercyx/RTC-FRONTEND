// src/services/call.service.ts
import { createWebRTCService, WebRTCService } from './webrtc.service';
import { CONTRACTS } from '../config/contract';
import { Transaction } from '@mysten/sui/transactions';

export class CallService {
  public webrtcService: WebRTCService | null = null;
  private currentCallSessionId: string | null = null;
  private signAndExecuteTransaction: any = null;
  private suiClient: any | null = null;

  constructor(signAndExecuteTransaction?: any, suiClient?: any) {
    if (signAndExecuteTransaction) this.signAndExecuteTransaction = signAndExecuteTransaction;
    this.suiClient = suiClient ?? null;
  }

  // ---------- Public API ----------
  public async initiateCall(
    callerProfileId: string,
    calleeAddress: string,
    calleeProfileId: string,
    callType: 'voice' | 'video'
  ): Promise<string> {
    try {
      console.log('Initiating call...', { callerProfileId, calleeAddress, calleeProfileId, callType });

      // create webRTC service (only safe in browser)
      this.webrtcService = createWebRTCService(callType);

      // subscribe to ICE candidate events 
      this.webrtcService.onIceCandidateCallback((candidate) => {
        console.log('ICE candidate generated:', candidate?.toJSON ? candidate.toJSON() : candidate);
        // In a real app, you'd send this to the remote peer via signaling
      });

      // request mic/camera
      await this.webrtcService.getLocalStream();

      // create offer
      const offer = await this.webrtcService.createOffer();
      console.log('Created offer:', offer);

      // create on-chain call session
      const sessionId = await this.createCallSession(
        callerProfileId,
        calleeAddress,
        calleeProfileId,
        JSON.stringify(offer)
      );

      this.webrtcService.setSessionId(sessionId);
      this.currentCallSessionId = sessionId;

      console.log('Call initiated with session ID:', sessionId);
      return sessionId;
    } catch (err) {
      console.error('Error initiating call:', err);
      await this.webrtcService?.endCall();
      this.webrtcService = null;
      throw err;
    }
  }

  public async answerCall(sessionId: string, callType: 'voice' | 'video'): Promise<void> {
    try {
      console.log('Answering call...', { sessionId, callType });

      this.webrtcService = createWebRTCService(callType);

      this.webrtcService.onIceCandidateCallback((candidate) => {
        console.log('ICE candidate generated:', candidate?.toJSON ? candidate.toJSON() : candidate);
      });

      await this.webrtcService.getLocalStream();

      // NEW: Fetch the actual offer from the call session object
      const offer = await this.getCallSessionOffer(sessionId);
      if (!offer) {
        throw new Error('Could not find offer in call session');
      }

      console.log('Found remote offer:', offer);
      
      // Create answer and set up the connection
      const answer = await this.webrtcService.setRemoteOffer(offer);
      console.log('Created answer:', answer);

      // NEW: Store the answer on-chain so the caller can get it
      await this.storeAnswer(sessionId, JSON.stringify(answer));

      this.webrtcService.setSessionId(sessionId);
      this.currentCallSessionId = sessionId;

      console.log('Call answered successfully');
    } catch (err) {
      console.error('Error answering call:', err);
      await this.webrtcService?.endCall();
      this.webrtcService = null;
      throw err;
    }
  }

  public async endCall(): Promise<void> {
    try {
      console.log('Ending call...');
      await this.webrtcService?.endCall();
      this.webrtcService = null;
      this.currentCallSessionId = null;
      console.log('Call ended successfully');
    } catch (err) {
      console.error('Error ending call:', err);
      try { await this.webrtcService?.endCall(); } catch (_) {}
      this.webrtcService = null;
      this.currentCallSessionId = null;
    }
  }

  public getCurrentSessionId(): string | null {
    return this.currentCallSessionId;
  }

  public isCallActive(): boolean {
    return this.webrtcService !== null && this.currentCallSessionId !== null;
  }

  // NEW: Fetch call session offer from blockchain
  private async getCallSessionOffer(sessionId: string): Promise<RTCSessionDescriptionInit | null> {
    try {
      if (!this.suiClient) {
        throw new Error('Sui client not available');
      }

      const sessionObject = await this.suiClient.getObject({
        id: sessionId,
        options: { showContent: true }
      });

      if (sessionObject.data?.content) {
        const sessionData = (sessionObject.data.content as any).fields;
        const offerBytes = sessionData.offer;
        
        if (offerBytes && Array.isArray(offerBytes)) {
          const offerString = new TextDecoder().decode(new Uint8Array(offerBytes));
          return JSON.parse(offerString);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching call session offer:', error);
      return null;
    }
  }

  // NEW: Store answer on-chain
  private async storeAnswer(sessionId: string, answerSdp: string): Promise<void> {
    try {
      const tx = new Transaction();
      
      const answerBytes = new TextEncoder().encode(answerSdp);
      
      tx.moveCall({
        target: `${CONTRACTS.PACKAGE_ID}::call_session::answer_call_entry`,
        arguments: [
          tx.object(sessionId), // Call session object
          tx.pure.vector('u8', answerBytes), // Answer SDP
        ],
      });

      tx.setGasBudget(100000000);

      const result = await this.executeTransaction(tx);
      console.log('Answer stored successfully:', result);
    } catch (error) {
      console.error('Error storing answer:', error);
      throw error;
    }
  }

  // NEW: Check for answers when we're the caller
  public async checkForAnswer(sessionId: string): Promise<RTCSessionDescriptionInit | null> {
    try {
      if (!this.suiClient) return null;

      const sessionObject = await this.suiClient.getObject({
        id: sessionId,
        options: { showContent: true }
      });

      if (sessionObject.data?.content) {
        const sessionData = (sessionObject.data.content as any).fields;
        const answerBytes = sessionData.answer;
        
        if (answerBytes && Array.isArray(answerBytes)) {
          const answerString = new TextDecoder().decode(new Uint8Array(answerBytes));
          return JSON.parse(answerString);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error checking for answer:', error);
      return null;
    }
  }

  // Rest of your existing methods (createCallSession, executeTransaction, extractCreatedObjectId) remain the same
  private async createCallSession(
    callerProfileId: string,
    callee: string,
    calleeProfileId: string,
    offerSdp: string
  ): Promise<string> {
    try {
      const tx = new Transaction();
      const offerBytes = new TextEncoder().encode(offerSdp);
      const calleeProfileBytes = new TextEncoder().encode(calleeProfileId);

      console.log('Creating transaction with:', {
        callerProfileId,
        callee,
        calleeProfileId,
        offerBytesLength: offerBytes.length,
        calleeProfileBytesLength: calleeProfileBytes.length,
        packageId: CONTRACTS.PACKAGE_ID
      });

      tx.moveCall({
        target: `${CONTRACTS.PACKAGE_ID}::call_session::initiate_call_entry`,
        arguments: [
          tx.object(callerProfileId),
          tx.pure.address(callee),
          tx.pure.vector('u8', calleeProfileBytes),
          tx.pure.vector('u8', offerBytes),
        ],
      });

      tx.setGasBudget(100000000);

      const result = await this.executeTransaction(tx);
      console.log('Transaction execution result:', result);

      if (!result) {
        throw new Error('Transaction execution returned undefined result');
      }

      const sessionId = this.extractCreatedObjectId(result);
      if (!sessionId) {
        console.error('Could not extract session id from result:', JSON.stringify(result, null, 2));
        throw new Error('Failed to create call session - no session ID found in transaction result');
      }
      return sessionId;
    } catch (err) {
      console.error('createCallSession error', err);
      throw err;
    }
  }

  private async executeTransaction(tx: Transaction): Promise<any> {
    if (!this.signAndExecuteTransaction) {
      throw new Error('No signAndExecuteTransaction function provided to CallService constructor');
    }

    console.log('Executing transaction with signAndExecuteTransaction:', typeof this.signAndExecuteTransaction);

    try {
      if (this.signAndExecuteTransaction.length === 0 || this.signAndExecuteTransaction.length === 1) {
        console.log('Using promise-based transaction execution');
        
        const attempts = [
          { transaction: tx, options: { showEffects: true, showObjectChanges: true } },
          { transactionBlock: tx, options: { showEffects: true, showObjectChanges: true } },
        ];

        for (const attempt of attempts) {
          try {
            console.log('Attempting with parameters:', Object.keys(attempt));
            const result = await this.signAndExecuteTransaction(attempt);
            if (result) {
              console.log('Transaction successful with attempt:', Object.keys(attempt));
              return result;
            }
          } catch (attemptError) {
            console.log(`Attempt failed with ${Object.keys(attempt)}:`, attemptError);
          }
        }

        throw new Error('All promise-based attempts failed');
      } else {
        console.log('Using callback-based transaction execution');
        return await new Promise((resolve, reject) => {
          this.signAndExecuteTransaction(
            { 
              transaction: tx, 
              options: { 
                showEffects: true, 
                showObjectChanges: true 
              } 
            },
            {
              onSuccess: (res: any) => {
                console.log('Callback onSuccess received:', res);
                resolve(res);
              },
              onError: (err: any) => {
                console.error('Callback onError received:', err);
                reject(err);
              },
            }
          );
        });
      }
    } catch (err: any) {
      console.error('executeTransaction: all methods failed', err);
      throw new Error(`Transaction execution failed: ${err.message}`);
    }
  }

  private extractCreatedObjectId(result: any): string | null {
    if (!result || typeof result !== 'object') {
      console.error('Invalid result object:', result);
      return null;
    }

    console.log('Extracting object ID from result structure:', Object.keys(result));

    if (result.effects?.created) {
      console.log('Checking effects.created:', result.effects.created);
      for (const createdObj of result.effects.created) {
        const id = createdObj?.reference?.objectId || createdObj?.objectId;
        if (id) {
          console.log('Found session ID from effects.created:', id);
          return id;
        }
      }
    }

    if (result.objectChanges) {
      console.log('Checking objectChanges:', result.objectChanges);
      for (const change of result.objectChanges) {
        if (change.type === 'created' && change.objectId) {
          console.log('Found session ID from objectChanges:', change.objectId);
          return change.objectId;
        }
      }
    }

    if (result.events) {
      console.log('Checking events:', result.events);
      for (const event of result.events) {
        if (event.id && event.id.txDigest) {
          console.log('Found digest from events:', event.id.txDigest);
          return event.id.txDigest;
        }
      }
    }

    if (result.digest) {
      console.log('Using transaction digest as session ID:', result.digest);
      return result.digest;
    }

    if (result.objectId) {
      console.log('Found session ID from result.objectId:', result.objectId);
      return result.objectId;
    }

    console.error('No session ID found in any expected result structure');
    console.error('Full result:', JSON.stringify(result, null, 2));
    return null;
  }
}