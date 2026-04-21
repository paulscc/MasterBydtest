import { Client } from 'pg';

// Configuración de AWS RDS desde variables de entorno
const AWS_RDS_CONFIG = {
  host: process.env.AWS_RDS_HOST,
  port: parseInt(process.env.AWS_RDS_PORT || '5432'),
  database: process.env.AWS_RDS_DATABASE,
  user: process.env.AWS_RDS_USER,
  password: process.env.AWS_RDS_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  } // AWS RDS requiere SSL incluso en desarrollo
};

export class RDSService {
  private client: Client;

  constructor() {
    this.client = new Client(AWS_RDS_CONFIG);
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      console.log('Connected to AWS RDS');
    } catch (error) {
      console.error('Error connecting to AWS RDS:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.end();
      console.log('Disconnected from AWS RDS');
    } catch (error) {
      console.error('Error disconnecting from AWS RDS:', error);
    }
  }

  async createSchema(schemaName: string): Promise<void> {
    try {
      const query = `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`;
      await this.client.query(query);
      console.log(`Schema ${schemaName} created successfully`);
    } catch (error) {
      console.error(`Error creating schema ${schemaName}:`, error);
      throw error;
    }
  }

  async executeSchemaScript(schemaName: string, scriptContent: string): Promise<void> {
    try {
      // Establecer el search_path al nuevo schema
      await this.client.query(`SET search_path TO "${schemaName}", public`);
      
      // Ejecutar el script del esquema
      await this.client.query(scriptContent);
      
      console.log(`Schema script executed successfully for ${schemaName}`);
    } catch (error) {
      console.error(`Error executing schema script for ${schemaName}:`, error);
      throw error;
    }
  }

  async createClientSchema(clientData: {
    subdomain: string;
    businessName: string;
  }): Promise<string> {
    const schemaName = `tenant_${clientData.subdomain.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    try {
      await this.connect();
      
      // 1. Crear el schema
      await this.createSchema(schemaName);
      
      // 2. Leer y ejecutar el script corrected++.sql
      const fs = require('fs');
      const path = require('path');
      const scriptPath = path.join(process.cwd(), 'script_corrected++.sql');
      const scriptContent = fs.readFileSync(scriptPath, 'utf8');
      
      await this.executeSchemaScript(schemaName, scriptContent);
      
      return schemaName;
    } catch (error) {
      console.error('Error creating client schema:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      const result = await this.client.query('SELECT NOW()');
      await this.disconnect();
      return true;
    } catch (error) {
      console.error('AWS RDS connection test failed:', error);
      return false;
    }
  }
}

export const rdsService = new RDSService();
