package org.ironrhino.core.cache;

import java.lang.reflect.Method;

import org.aopalliance.aop.Advice;
import org.springframework.aop.Pointcut;
import org.springframework.aop.support.AbstractPointcutAdvisor;
import org.springframework.aop.support.StaticMethodMatcherPointcut;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.core.BridgeMethodResolver;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;

@Component
public class CacheAspect extends AbstractPointcutAdvisor {

	private static final long serialVersionUID = -9093221616339043624L;

	private final static int DEFAULT_MUTEX_WAIT = 200;

	@Autowired
	private ApplicationContext ctx;

	// lazy get CacheManager from ctx
	// @Autowired
	// private CacheManager cacheManager;

	@Value("${cacheAspect.mutex:true}")
	private boolean mutex;

	@Value("${cacheAspect.mutexWait:" + DEFAULT_MUTEX_WAIT + "}")
	private int mutexWait = DEFAULT_MUTEX_WAIT;

	private int order = Ordered.HIGHEST_PRECEDENCE + 3;

	private transient final StaticMethodMatcherPointcut pointcut = new StaticMethodMatcherPointcut() {
		@Override
		public boolean matches(Method method, Class<?> targetClass) {
			if (method.isBridge())
				method = BridgeMethodResolver.findBridgedMethod(method);
			return method.getAnnotation(CheckCache.class) != null || method.getAnnotation(EvictCache.class) != null;
		}
	};

	private volatile transient CacheInterceptor interceptor;

	@Override
	public int getOrder() {
		return order;
	}

	@Override
	public void setOrder(int order) {
		this.order = order;
	}

	@Override
	public Pointcut getPointcut() {
		return pointcut;
	}

	@Override
	public Advice getAdvice() {
		if (interceptor == null) {
			synchronized (this) {
				if (interceptor == null) {
					CacheInterceptor temp = new CacheInterceptor();
					CacheManager cacheManager = ctx.getBean(CacheManager.class);
					temp.setCacheManager(cacheManager);
					temp.setMutex(mutex);
					temp.setMutexWait(mutexWait);
					interceptor = temp;
				}
			}
		}
		return interceptor;
	}

}
