package org.ironrhino.core.remoting.action;

import java.util.Collection;
import java.util.Map;

import org.ironrhino.core.metadata.Authorize;
import org.ironrhino.core.metadata.AutoConfig;
import org.ironrhino.core.metadata.JsonConfig;
import org.ironrhino.core.remoting.ServiceRegistry;
import org.ironrhino.core.security.role.UserRole;
import org.ironrhino.core.struts.BaseAction;
import org.springframework.beans.factory.annotation.Autowired;

@AutoConfig
@Authorize(ifAnyGranted = UserRole.ROLE_ADMINISTRATOR)
public class ConsoleAction extends BaseAction {

	private static final long serialVersionUID = 8180265410790553918L;

	@Autowired
	private transient ServiceRegistry serviceRegistry;

	private Map<String, Collection<String>> hosts;

	private Map<String, String> importedServices;

	public Map<String, Collection<String>> getHosts() {
		return hosts;
	}

	public Map<String, String> getImportedServices() {
		return importedServices;
	}

	public ServiceRegistry getServiceRegistry() {
		return serviceRegistry;
	}

	@Override
	public String execute() {
		return SUCCESS;
	}

	@JsonConfig(root = "hosts")
	public String hosts() {
		hosts = serviceRegistry.getExportedHostsForService(getUid());
		return JSON;
	}

	@JsonConfig(root = "importedServices")
	public String services() {
		importedServices = serviceRegistry.getImportedServices(getUid());
		return JSON;
	}

}
