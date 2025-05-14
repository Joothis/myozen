// sync.service.js - Service for syncing offline data to cloud

const { EMGData, EMSData } = require('../models/data.model');

/**
 * Sync service for handling offline data synchronization
 */
class SyncService {
  constructor() {
    this.syncInterval = null;
    this.isSyncing = false;
  }
  
  /**
   * Start the sync job
   */
  startSyncJob() {
    const interval = parseInt(process.env.CLOUD_SYNC_INTERVAL) || 300000; // Default: 5 minutes
    
    console.log(`🔄 Starting cloud sync service (interval: ${interval}ms)`);
    
    this.syncInterval = setInterval(() => {
      this.syncData();
    }, interval);
  }
  
  /**
   * Stop the sync job
   */
  stopSyncJob() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('🛑 Cloud sync service stopped');
    }
  }
  
  /**
   * Sync data to cloud
   */
  async syncData() {
    // Prevent multiple sync jobs running simultaneously
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress, skipping...');
      return;
    }
    
    this.isSyncing = true;
    console.log('🔄 Starting data sync to cloud...');
    
    try {
      // Sync EMG data
      const pendingEMGData = await EMGData.find({
        'syncStatus.synced': false
      }).limit(100);
      
      if (pendingEMGData.length > 0) {
        console.log(`Found ${pendingEMGData.length} EMG records to sync`);
        
        for (const record of pendingEMGData) {
          await this.syncEMGRecord(record);
        }
      }
      
      // Sync EMS data
      const pendingEMSData = await EMSData.find({
        'syncStatus.synced': false
      }).limit(100);
      
      if (pendingEMSData.length > 0) {
        console.log(`Found ${pendingEMSData.length} EMS records to sync`);
        
        for (const record of pendingEMSData) {
          await this.syncEMSRecord(record);
        }
      }
      
      console.log('✅ Data sync completed');
    } catch (error) {
      console.error('❌ Error during data sync:', error);
    } finally {
      this.isSyncing = false;
    }
  }
  
  /**
   * Sync a single EMG record to cloud
   * @param {Object} record - EMG data record
   */
  async syncEMGRecord(record) {
    try {
      // In a real implementation, this would send data to a cloud service
      // For this example, we'll just mark it as synced
      
      // Simulate cloud API call with delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Update record sync status
      record.syncStatus.synced = true;
      record.syncStatus.syncedAt = new Date();
      await record.save();
      
      console.log(`✅ Synced EMG record: ${record._id}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to sync EMG record ${record._id}:`, error);
      return false;
    }
  }
  
  /**
   * Sync a single EMS record to cloud
   * @param {Object} record - EMS data record
   */
  async syncEMSRecord(record) {
    try {
      // In a real implementation, this would send data to a cloud service
      // For this example, we'll just mark it as synced
      
      // Simulate cloud API call with delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Update record sync status
      record.syncStatus.synced = true;
      record.syncStatus.syncedAt = new Date();
      await record.save();
      
      console.log(`✅ Synced EMS record: ${record._id}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to sync EMS record ${record._id}:`, error);
      return false;
    }
  }
  
  /**
   * Force sync for specific records
   * @param {Array} recordIds - Array of record IDs to sync
   * @param {String} dataType - 'emg' or 'ems'
   */
  async forceSyncRecords(recordIds, dataType) {
    try {
      const Model = dataType.toLowerCase() === 'emg' ? EMGData : EMSData;
      const records = await Model.find({ _id: { $in: recordIds } });
      
      console.log(`🔄 Force syncing ${records.length} ${dataType} records...`);
      
      let successCount = 0;
      
      for (const record of records) {
        const success = dataType.toLowerCase() === 'emg' 
          ? await this.syncEMGRecord(record)
          : await this.syncEMSRecord(record);
          
        if (success) successCount++;
      }
      
      return {
        total: records.length,
        success: successCount,
        failed: records.length - successCount
      };
    } catch (error) {
      console.error('❌ Error during force sync:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
exports.syncService = new SyncService();
