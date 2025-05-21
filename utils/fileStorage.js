import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta base al directorio de datos
const DATA_DIR = path.join(__dirname, '../data');

/**
 * Clase para manejar el almacenamiento y gestión de datos en archivos JSON
 */
class FileStorage {
  /**
   * Constructor
   * @param {String} entity - Nombre de la entidad (usado para el nombre del archivo)
   */
  constructor(entity) {
    this.filePath = path.join(DATA_DIR, `${entity}.json`);
    this.entity = entity;
  }

  /**
   * Obtener todos los registros
   * @returns {Promise<Array>} - Registros encontrados
   */
  async findAll() {
    try {
      await this._ensureDataDir();
      const data = await this._readFile();
      return data;
    } catch (error) {
      console.error(`Error al leer ${this.entity}:`, error.message);
      return [];
    }
  }

  /**
   * Encontrar registros por criterio de búsqueda
   * @param {Object} criteria - Criterio de búsqueda en formato {campo: valor}
   * @returns {Promise<Array>} - Registros que coinciden con el criterio
   */
  async findBy(criteria) {
    try {
      const data = await this.findAll();
      return data.filter(item => {
        return Object.entries(criteria).every(([key, value]) => item[key] === value);
      });
    } catch (error) {
      console.error(`Error al buscar ${this.entity} por criterio:`, error.message);
      return [];
    }
  }

  /**
   * Buscar un único registro por su ID
   * @param {String} id - ID del registro
   * @returns {Promise<Object|null>} - Registro encontrado o null
   */
  async findById(id) {
    try {
      const data = await this.findAll();
      return data.find(item => item.id === id) || null;
    } catch (error) {
      console.error(`Error al buscar ${this.entity} por ID:`, error.message);
      return null;
    }
  }

  /**
   * Crear un nuevo registro
   * @param {Object} data - Datos del nuevo registro
   * @returns {Promise<Object>} - Registro creado
   */
  async create(data) {
    try {
      await this._ensureDataDir();
      const currentData = await this.findAll();
      
      // Validación básica: si hay un ID, asegurarse que no exista duplicado
      if (data.id && currentData.some(item => item.id === data.id)) {
        throw new Error(`Ya existe un ${this.entity} con el ID ${data.id}`);
      }
      
      // Agregar timestamps
      const now = new Date();
      const newItem = {
        ...data,
        createdAt: now,
        updatedAt: now
      };
      
      // Agregar a la lista y guardar
      currentData.push(newItem);
      await this._writeFile(currentData);
      
      return newItem;
    } catch (error) {
      console.error(`Error al crear ${this.entity}:`, error.message);
      throw error;
    }
  }

  /**
   * Actualizar un registro existente
   * @param {String} id - ID del registro a actualizar
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object|null>} - Registro actualizado o null si no existe
   */
  async update(id, data) {
    try {
      const currentData = await this.findAll();
      const index = currentData.findIndex(item => item.id === id);
      
      if (index === -1) {
        return null;
      }
      
      // Mantener el ID y la fecha de creación originales
      const updatedItem = {
        ...currentData[index],
        ...data,
        id, // Mantener el ID original
        createdAt: currentData[index].createdAt, // Mantener createdAt original
        updatedAt: new Date() // Actualizar updatedAt
      };
      
      currentData[index] = updatedItem;
      await this._writeFile(currentData);
      
      return updatedItem;
    } catch (error) {
      console.error(`Error al actualizar ${this.entity}:`, error.message);
      throw error;
    }
  }

  /**
   * Eliminar un registro por su ID
   * @param {String} id - ID del registro a eliminar
   * @returns {Promise<boolean>} - true si se eliminó, false si no existía
   */
  async delete(id) {
    try {
      const currentData = await this.findAll();
      const index = currentData.findIndex(item => item.id === id);
      
      if (index === -1) {
        return false;
      }
      
      currentData.splice(index, 1);
      await this._writeFile(currentData);
      
      return true;
    } catch (error) {
      console.error(`Error al eliminar ${this.entity}:`, error.message);
      throw error;
    }
  }

  /**
   * Método privado para asegurar que existe el directorio de datos
   * @private
   */
  async _ensureDataDir() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
      console.error(`Error al crear directorio de datos:`, error.message);
      throw error;
    }
  }

  /**
   * Método privado para leer el archivo JSON
   * @private
   * @returns {Promise<Array>} - Datos del archivo
   */
  async _readFile() {
    try {
      const data = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      // Si el archivo no existe, devolver un array vacío
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Método privado para escribir en el archivo JSON
   * @private
   * @param {Array} data - Datos a escribir
   */
  async _writeFile(data) {
    try {
      const jsonData = JSON.stringify(data, null, 2);
      await fs.writeFile(this.filePath, jsonData, 'utf8');
    } catch (error) {
      console.error(`Error al escribir en ${this.filePath}:`, error.message);
      throw error;
    }
  }
}

export default FileStorage; 