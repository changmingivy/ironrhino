package org.ironrhino.common.record;

import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.event.spi.AbstractEvent;
import org.hibernate.event.spi.PostDeleteEvent;
import org.hibernate.event.spi.PostInsertEvent;
import org.hibernate.event.spi.PostUpdateEvent;
import org.hibernate.id.ForeignGenerator;
import org.hibernate.id.IdentifierGenerator;
import org.hibernate.tuple.entity.EntityMetamodel;
import org.hibernate.type.BagType;
import org.hibernate.type.Type;
import org.ironrhino.core.aop.AopContext;
import org.ironrhino.core.event.EntityOperationType;
import org.ironrhino.core.model.Persistable;
import org.ironrhino.core.spring.configuration.BeanPresentConditional;
import org.ironrhino.core.util.AuthzUtils;
import org.ironrhino.core.util.ReflectionUtils;
import org.ironrhino.core.util.StringUtils;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.Ordered;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronizationAdapter;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.google.common.base.Objects;

@Aspect
@Component
@BeanPresentConditional(type = SessionFactory.class)
public class RecordAspect extends TransactionSynchronizationAdapter implements Ordered {

	private static final String HIBERNATE_EVENTS = "HIBERNATE_EVENTS_FOR_RECORD";

	@Autowired
	private Logger logger;

	@Autowired
	private SessionFactory sessionFactory;

	private int order;

	public RecordAspect() {
		order = 1;
	}

	@Override
	public int getOrder() {
		return order;
	}

	public void setOrder(int order) {
		this.order = order;
	}

	protected boolean isBypass() {
		return AopContext.isBypass(this.getClass());
	}

	@Before("execution(public * *(..)) and @annotation(transactional)")
	public void registerTransactionSyncrhonization(JoinPoint jp, Transactional transactional) {
		if (!isBypass() && !transactional.readOnly())
			TransactionSynchronizationManager.registerSynchronization(this);
	}

	@Override
	public void afterCommit() {
		List<AbstractEvent> events = getHibernateEvents(false);
		if (events == null || events.isEmpty())
			return;

		Session session = sessionFactory.getCurrentSession();
		for (AbstractEvent event : events) {
			try {
				Object entity;
				EntityOperationType action;
				String payload = null;
				if (event instanceof PostInsertEvent) {
					PostInsertEvent pie = (PostInsertEvent) event;
					entity = pie.getEntity();
					action = EntityOperationType.CREATE;
					String[] propertyNames = pie.getPersister().getEntityMetamodel().getPropertyNames();
					StringBuilder sb = new StringBuilder();
					boolean sep = false;
					for (int i = 0; i < propertyNames.length; i++) {
						Object value = pie.getState()[i];
						if (value == null || value instanceof Collection && ((Collection<?>) value).isEmpty()
								|| value.getClass().isArray() && Array.getLength(value) == 0)
							continue;
						if (sep)
							sb.append("\n------\n");
						sb.append(propertyNames[i]);
						sb.append(": ");
						sb.append(StringUtils.toString(value));
						sep = true;
					}
					payload = sb.toString();
				} else if (event instanceof PostUpdateEvent) {
					PostUpdateEvent pue = (PostUpdateEvent) event;
					entity = pue.getEntity();
					action = EntityOperationType.UPDATE;
					Object[] databaseSnapshot = pue.getOldState();
					Object[] propertyValues = pue.getState();
					int[] dirtyProperties = pue.getDirtyProperties();
					if (databaseSnapshot == null || dirtyProperties == null)
						continue;
					EntityMetamodel em = pue.getPersister().getEntityMetamodel();
					String[] propertyNames = em.getPropertyNames();
					StringBuilder sb = new StringBuilder();
					boolean sep = false;
					for (int i = 0; i < dirtyProperties.length; i++) {
						String propertyName = propertyNames[dirtyProperties[i]];
						Type type = em.getPropertyTypes()[dirtyProperties[i]];
						if (type instanceof BagType)
							continue;
						IdentifierGenerator ig = em.getIdentifierProperty().getIdentifierGenerator();
						if (ig instanceof ForeignGenerator) {
							if (propertyName.equals(((ForeignGenerator) ig).getPropertyName()))
								continue; // @MapsId
						}
						Object oldValue = databaseSnapshot[dirtyProperties[i]];
						Object newValue = propertyValues[dirtyProperties[i]];
						if (oldValue instanceof Persistable)
							oldValue = ((Persistable<?>) oldValue).getId();
						if (newValue instanceof Persistable)
							newValue = ((Persistable<?>) newValue).getId();
						if (Objects.equal(oldValue, newValue))
							continue;
						if (oldValue instanceof Collection && ((Collection<?>) oldValue).isEmpty() && newValue == null
								|| newValue instanceof Collection && ((Collection<?>) newValue).isEmpty()
										&& oldValue == null)
							continue;
						if (sep)
							sb.append("\n------\n");
						sb.append(propertyName);
						sb.append(": ");
						sb.append(StringUtils.toString(oldValue));
						sb.append(" -> ");
						sb.append(StringUtils.toString(newValue));
						sep = true;
					}
					payload = sb.toString();
					if (payload.isEmpty())
						continue;
				} else if (event instanceof PostDeleteEvent) {
					entity = ((PostDeleteEvent) event).getEntity();
					action = EntityOperationType.DELETE;
				} else {
					continue;
				}
				session.evict(entity);
				Record record = new Record();
				UserDetails ud = AuthzUtils.getUserDetails();
				if (ud != null) {
					record.setOperatorId(ud.getUsername());
					record.setOperatorClass(ud.getClass().getName());
				}
				record.setEntityId(String.valueOf(((Persistable<?>) entity).getId()));
				record.setEntityClass(ReflectionUtils.getActualClass(entity).getName());
				record.setEntityToString(payload != null ? payload : entity.toString());
				record.setAction(action.name());
				record.setRecordDate(new Date());
				session.save(record);
			} catch (Exception e) {
				logger.error(e.getMessage(), e);
			}
		}
		session.flush();
	}

	@Override
	public void afterCompletion(int status) {
		if (TransactionSynchronizationManager.hasResource(HIBERNATE_EVENTS))
			TransactionSynchronizationManager.unbindResource(HIBERNATE_EVENTS);
	}

	@SuppressWarnings("unchecked")
	public static List<AbstractEvent> getHibernateEvents(boolean create) {
		if (create && !TransactionSynchronizationManager.hasResource(HIBERNATE_EVENTS))
			TransactionSynchronizationManager.bindResource(HIBERNATE_EVENTS, new ArrayList<>());
		return (List<AbstractEvent>) TransactionSynchronizationManager.getResource(HIBERNATE_EVENTS);
	}

}
