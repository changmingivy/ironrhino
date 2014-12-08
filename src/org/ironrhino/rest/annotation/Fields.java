package org.ironrhino.rest.annotation;

import static java.lang.annotation.ElementType.PARAMETER;
import static java.lang.annotation.ElementType.METHOD;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

import java.lang.annotation.Retention;
import java.lang.annotation.Target;

@Target({ METHOD, PARAMETER })
@Retention(RUNTIME)
public @interface Fields {

	Field[] value();

	String sampleMethodName() default "";

}