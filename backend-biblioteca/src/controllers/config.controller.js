import * as configService from '../services/config.service.js';
import * as configRepo from '../repositories/config.repository.js';

export const getConfiguraciones = async (req, res, next) => {
  try {
    const configs = await configService.obtenerConfiguraciones();
    res.json({ success: true, data: configs });
  } catch (error) {
    next(error);
  }
};

/** Reglas del servicio que se muestran al público (sin exponer el resto de la configuración). */
export const getReglasPublicas = async (req, res, next) => {
  try {
    const numero = async (clave, porDefecto) => {
      const valor = Number((await configRepo.findByClave(clave))?.valor_configuracion);
      return Number.isFinite(valor) && valor > 0 ? valor : porDefecto;
    };
    const [maxPrestamos, diasPrestamo, diasRetiro, tarifaMultaDiaria] = await Promise.all([
      numero('MAX_PRESTAMOS_USUARIO', 3),
      numero('DIAS_MAX_PRESTAMO', 14),
      numero('DIAS_VENCIMIENTO_SOLICITUD', 3),
      numero('TARIFA_MULTA_DIARIA', 2000),
    ]);
    res.json({ success: true, data: { maxPrestamos, diasPrestamo, diasRetiro, tarifaMultaDiaria } });
  } catch (error) {
    next(error);
  }
};

export const getConfiguracionByClave = async (req, res, next) => {
  try {
    const config = await configService.obtenerConfiguracionPorClave(req.params.clave);
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
};

export const setConfiguracion = async (req, res, next) => {
  try {
    const { clave } = req.params;
    const valor = req.body.valor !== undefined ? req.body.valor : req.body.valor_configuracion;
    const descripcion = req.body.descripcion !== undefined ? req.body.descripcion : req.body.descripcion_configuracion;
    const guardada = await configService.guardarConfiguracion(clave, valor, descripcion, req.usuario);
    res.json({ success: true, data: guardada, message: 'Configuración guardada exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const deleteConfiguracion = async (req, res, next) => {
  try {
    const eliminada = await configService.eliminarConfiguracion(req.params.clave, req.usuario);
    res.json({ success: true, data: eliminada, message: 'Configuración eliminada exitosamente.' });
  } catch (error) {
    next(error);
  }
};
